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
	depends_on?: Record<string, { condition: string }>;
	environment?: Record<string, string>;
	exclude_from_hc?: boolean;
	expose?: string[];
	image?: string;
	ports?: string[];
	volumes?: string[];
}

interface ComposeDefinition {
	services: Record<string, ComposeService>;
	volumes?: Record<string, unknown>;
}

const services = [
	"commerce",
	"commerce-postgres",
	"commerce-seed",
	"commerce-worker",
	"migrate",
	"postgres",
	"server",
	"web",
];

function loadCompose(relativePath: string): ComposeDefinition {
	return YAML.parse(
		readFileSync(path.join(process.cwd(), relativePath), "utf8"),
		{ merge: true }
	) as ComposeDefinition;
}

function assertSharedStack(compose: ComposeDefinition) {
	assert.deepEqual(Object.keys(compose.services).sort(), services);
	assert.equal(
		compose.services.server.depends_on?.migrate?.condition,
		"service_completed_successfully"
	);
	assert.equal(
		compose.services.server.depends_on?.commerce?.condition,
		"service_healthy"
	);
	assert.equal(
		compose.services.commerce.depends_on?.["commerce-seed"]?.condition,
		"service_completed_successfully"
	);
	assert.equal(
		compose.services["commerce-worker"].depends_on?.["commerce-seed"]
			?.condition,
		"service_completed_successfully"
	);
	assert.equal(
		compose.services["commerce-seed"].depends_on?.["commerce-postgres"]
			?.condition,
		"service_healthy"
	);
	assert.equal(
		compose.services.web.environment?.VENDURE_SHOP_API_URL,
		"http://commerce:3050/shop-api"
	);
	assert.equal(
		compose.services.server.environment?.VENDURE_SHOP_API_URL,
		"http://commerce:3050/shop-api"
	);
	assert.equal(
		compose.services.commerce.environment?.DB_HOST,
		"commerce-postgres"
	);
	assert.equal(compose.services.web.image, compose.services.server.image);
	assert.equal(compose.services.migrate.image, compose.services.server.image);
	assert.equal(
		compose.services["commerce-seed"].image,
		compose.services.commerce.image
	);
	assert.equal(
		compose.services["commerce-worker"].image,
		compose.services.commerce.image
	);
	assert.deepEqual(
		Object.entries(compose.services)
			.filter(([, service]) => service.build)
			.map(([name]) => name)
			.sort(),
		["commerce", "server"]
	);
	assert.deepEqual(compose.services.commerce.volumes, [
		"commerce_assets:/app/apps/commerce/static/assets",
	]);
	for (const volume of [
		"ocdly_postgres_data",
		"commerce_postgres_data",
		"commerce_assets",
	]) {
		assert.ok(Object.hasOwn(compose.volumes ?? {}, volume));
	}
}

test("local Compose runs the complete stack with development ports", () => {
	const compose = loadCompose("docker-compose.yml");
	assertSharedStack(compose);
	assert.deepEqual(compose.services.web.ports, ["3001:3001"]);
	assert.deepEqual(compose.services.server.ports, ["3000:3000"]);
	assert.deepEqual(compose.services.commerce.ports, ["3050:3050"]);
	assert.deepEqual(compose.services.postgres.ports, ["5432:5432"]);
	assert.deepEqual(compose.services["commerce-postgres"].ports, ["5433:5432"]);
});

test("Coolify Compose exposes only the three staging services", () => {
	const compose = loadCompose("docker-compose.coolify.yml");
	assertSharedStack(compose);
	for (const service of Object.values(compose.services)) {
		assert.equal(service.ports, undefined);
	}
	assert.deepEqual(compose.services.web.expose, ["3001"]);
	assert.deepEqual(compose.services.server.expose, ["3000"]);
	assert.deepEqual(compose.services.commerce.expose, ["3050"]);
	assert.equal(compose.services.postgres.expose, undefined);
	assert.equal(compose.services["commerce-postgres"].expose, undefined);
	assert.equal(compose.services.migrate.exclude_from_hc, true);
	assert.equal(compose.services["commerce-seed"].exclude_from_hc, true);
	assert.equal(
		compose.services.server.build?.args?.PUBLIC_API_URL,
		"https://api.ocdly.blckh.top"
	);
	assert.equal(
		compose.services.server.environment?.SERVICE_URL_WEB,
		"https://ocdly.blckh.top"
	);
	assert.equal(
		compose.services.commerce.environment?.VENDURE_ASSET_URL,
		"https://commerce.ocdly.blckh.top/assets/"
	);
	assert.equal(
		compose.services.commerce.environment?.VENDURE_CORS_ORIGINS,
		"https://ocdly.blckh.top"
	);
});
