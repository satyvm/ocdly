import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import YAML from "yaml";

interface ComposeService {
	build?: {
		args?: Record<string, string>;
		context?: string;
		dockerfile?: string;
	};
	command?: string[];
	depends_on?: Record<string, { condition: string }>;
	entrypoint?: string[];
	environment?: Record<string, string>;
	expose?: string[];
	image?: string;
	ports?: string[];
	volumes?: string[];
}

interface ComposeDefinition {
	services: Record<string, ComposeService>;
	volumes?: Record<string, unknown>;
}

const ENV_PREFIX = "$";
const COOLIFY_COMMERCE_IMAGE = `${ENV_PREFIX}{COOLIFY_RESOURCE_UUID:-ocdly}-commerce`;
const COOLIFY_SERVER_URL = `${ENV_PREFIX}{SERVICE_URL_SERVER:-http://localhost:3000}`;
const COOLIFY_WEB_URL = `${ENV_PREFIX}{SERVICE_URL_WEB:-http://localhost:3001}`;
const DERIVED_APPLICATION_VARIABLES = new Set([
	"AXIOM_API_KEY",
	"AXIOM_DATASET",
	"AXIOM_EDGE_URL",
	"BETTER_AUTH_URL",
	"CORS_ORIGIN",
	"DATABASE_URL",
	"NODE_ENV",
	"VITE_SERVER_URL",
]);

function loadCompose(relativePath: string): ComposeDefinition {
	return YAML.parse(
		readFileSync(path.join(process.cwd(), relativePath), "utf8"),
		{ merge: true }
	) as ComposeDefinition;
}

function assertPrivateNetworkOnly(compose: ComposeDefinition) {
	for (const [name, service] of Object.entries(compose.services)) {
		assert.equal(
			service.ports,
			undefined,
			`${name} must not publish host ports in Coolify`
		);
	}
}

function assertNoDerivedApplicationVariables(compose: ComposeDefinition) {
	for (const [name, service] of Object.entries(compose.services)) {
		const composeManagedKeys = [
			...Object.keys(service.environment ?? {}),
			...Object.keys(service.build?.args ?? {}),
		];
		const derivedKeys = composeManagedKeys.filter((key) =>
			DERIVED_APPLICATION_VARIABLES.has(key)
		);
		assert.deepEqual(
			derivedKeys,
			[],
			`${name} must derive application variables inside its container`
		);
	}
}

test("storefront Compose uses Coolify routing and ordered migrations", () => {
	const compose = loadCompose("docker-compose.coolify.yml");
	assert.deepEqual(Object.keys(compose.services).sort(), [
		"migrate",
		"postgres",
		"server",
		"web",
	]);
	assertPrivateNetworkOnly(compose);
	assertNoDerivedApplicationVariables(compose);

	assert.deepEqual(compose.services.web.expose, ["3001"]);
	assert.deepEqual(compose.services.server.expose, ["3000"]);
	assert.equal(
		compose.services.server.build?.args?.PUBLIC_API_URL,
		COOLIFY_SERVER_URL
	);
	assert.equal(
		compose.services.server.environment?.SERVICE_URL_SERVER,
		COOLIFY_SERVER_URL
	);
	assert.equal(
		compose.services.server.environment?.SERVICE_URL_WEB,
		COOLIFY_WEB_URL
	);
	assert.deepEqual(compose.services.server.entrypoint, [
		"/app/apps/server/docker-entrypoint.sh",
	]);
	assert.equal(
		compose.services.server.depends_on?.migrate?.condition,
		"service_completed_successfully"
	);
	assert.deepEqual(compose.services.migrate.entrypoint, [
		"/app/apps/server/docker-entrypoint.sh",
	]);
	assert.deepEqual(compose.services.migrate.command, [
		"bun",
		"run",
		"--cwd",
		"/app/packages/db",
		"db:migrate:deploy",
	]);
	assert.ok(Object.hasOwn(compose.volumes ?? {}, "ocdly_postgres_data"));
});

test("commerce Compose keeps state private and gates runtime on seeding", () => {
	const compose = loadCompose("apps/commerce/compose.coolify.yml");
	assert.deepEqual(Object.keys(compose.services).sort(), [
		"postgres",
		"seed",
		"server",
		"worker",
	]);
	assertPrivateNetworkOnly(compose);
	assertNoDerivedApplicationVariables(compose);

	assert.equal(compose.services.server.build?.context, ".");
	assert.equal(
		compose.services.server.build?.dockerfile,
		"apps/commerce/Dockerfile"
	);
	assert.deepEqual(
		Object.entries(compose.services)
			.filter(([, service]) => service.build)
			.map(([name]) => name),
		["server"]
	);
	assert.deepEqual(
		["seed", "server", "worker"].map((name) => compose.services[name].image),
		Array.from({ length: 3 }, () => COOLIFY_COMMERCE_IMAGE)
	);
	assert.deepEqual(compose.services.server.expose, ["3050"]);
	assert.equal(
		compose.services.server.depends_on?.seed?.condition,
		"service_completed_successfully"
	);
	assert.equal(
		compose.services.worker.depends_on?.seed?.condition,
		"service_completed_successfully"
	);
	assert.deepEqual(compose.services.server.volumes, [
		"commerce_assets:/app/apps/commerce/static/assets",
	]);
	assert.ok(Object.hasOwn(compose.volumes ?? {}, "commerce_postgres_data"));
	assert.ok(Object.hasOwn(compose.volumes ?? {}, "commerce_assets"));
});
