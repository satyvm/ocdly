import assert from "node:assert/strict";
import test from "node:test";
import { loadEnvironment } from "./environment";

const COOKIE_SECRET_REQUIRED = /COOKIE_SECRET is required/;
const DB_SSL_INVALID = /DB_SSL must be true or false/;
const IDENTITY_SECRET_TOO_SHORT =
	/VENDURE_IDENTITY_SECRET must contain at least 32 bytes/;

test("uses local-first defaults", () => {
	const result = loadEnvironment({ NODE_ENV: "development" });

	assert.equal(result.port, 3050);
	assert.equal(result.database.port, 5433);
	assert.equal(result.database.name, "ocdly_commerce");
	assert.equal(result.channelToken, "ocdly-web");
	assert.equal(result.corsOrigins, true);
});

test("requires secrets and explicit CORS in production", () => {
	assert.throws(
		() => loadEnvironment({ NODE_ENV: "production" }),
		COOKIE_SECRET_REQUIRED
	);

	const result = loadEnvironment({
		COOKIE_SECRET: "0123456789abcdef0123456789abcdef",
		DB_PASSWORD: "not-a-development-password",
		NODE_ENV: "production",
		SUPERADMIN_PASSWORD: "not-a-development-password",
		SUPERADMIN_USERNAME: "operations@ocdly.com",
		VENDURE_CHANNEL_TOKEN: "production-channel-token",
	});

	assert.deepEqual(result.corsOrigins, []);
	assert.equal(result.database.ssl, false);
});

test("parses comma-separated origins and validates scalar values", () => {
	const result = loadEnvironment({
		DB_SSL: "true",
		NODE_ENV: "development",
		VENDURE_CORS_ORIGINS: "http://localhost:3001, https://preview.example.com ",
		VENDURE_PORT: "4050",
	});

	assert.deepEqual(result.corsOrigins, [
		"http://localhost:3001",
		"https://preview.example.com",
	]);
	assert.equal(result.database.ssl, true);
	assert.equal(result.port, 4050);
	assert.throws(() => loadEnvironment({ DB_SSL: "sometimes" }), DB_SSL_INVALID);
	assert.throws(
		() => loadEnvironment({ VENDURE_IDENTITY_SECRET: "too-short" }),
		IDENTITY_SECRET_TOO_SHORT
	);
});
