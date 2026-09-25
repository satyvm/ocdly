import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
	IdentityAssertionError,
	verifyBetterAuthIdentityAssertion,
} from "./better-auth-identity-assertion";

const SECRET = "0123456789abcdef0123456789abcdef";
const NOW_SECONDS = 1_800_000_000;
const PHONE_NOT_VERIFIED = /Phone number is not verified/;
const INVALID_LIFETIME = /Assertion lifetime is invalid/;
const INVALID_PHONE_NUMBER = /Phone number is invalid/;
const verifierOptions = {
	audience: "ocdly-vendure",
	issuer: "https://identity.ocdly.com",
	now: () => NOW_SECONDS * 1000,
	secret: SECRET,
};

function sign(payload: Record<string, unknown>, secret = SECRET) {
	const header = Buffer.from(
		JSON.stringify({ alg: "HS256", typ: "JWT" })
	).toString("base64url");
	const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
	const signature = createHmac("sha256", secret)
		.update(`${header}.${body}`)
		.digest("base64url");
	return `${header}.${body}.${signature}`;
}

function claims(overrides: Record<string, unknown> = {}) {
	return {
		aud: verifierOptions.audience,
		exp: NOW_SECONDS + 60,
		iat: NOW_SECONDS,
		iss: verifierOptions.issuer,
		phone_number: "+919876543210",
		phone_number_verified: true,
		sub: "better-auth-user-1",
		...overrides,
	};
}

test("verifies a short-lived assertion for a verified phone identity", () => {
	const result = verifyBetterAuthIdentityAssertion(
		sign(claims()),
		verifierOptions
	);

	assert.equal(result.sub, "better-auth-user-1");
	assert.equal(result.phone_number_verified, true);
	assert.equal(result.phone_number, "+919876543210");
});

test("rejects a tampered assertion", () => {
	const assertion = sign(claims());
	const [header, _payload, signature] = assertion.split(".");
	const tamperedPayload = Buffer.from(
		JSON.stringify(claims({ sub: "attacker" }))
	).toString("base64url");

	assert.throws(
		() =>
			verifyBetterAuthIdentityAssertion(
				`${header}.${tamperedPayload}.${signature}`,
				verifierOptions
			),
		(error: unknown) =>
			error instanceof IdentityAssertionError &&
			error.code === "invalid_signature"
	);
});

test("rejects an expired assertion", () => {
	assert.throws(
		() =>
			verifyBetterAuthIdentityAssertion(
				sign(claims({ exp: NOW_SECONDS - 10, iat: NOW_SECONDS - 70 })),
				verifierOptions
			),
		(error: unknown) =>
			error instanceof IdentityAssertionError && error.code === "expired"
	);
});

test("rejects unverified phone identities and overlong lifetimes", () => {
	assert.throws(
		() =>
			verifyBetterAuthIdentityAssertion(
				sign(claims({ phone_number_verified: false })),
				verifierOptions
			),
		PHONE_NOT_VERIFIED
	);
	assert.throws(
		() =>
			verifyBetterAuthIdentityAssertion(
				sign(claims({ phone_number: "not-a-phone" })),
				verifierOptions
			),
		INVALID_PHONE_NUMBER
	);
	assert.throws(
		() =>
			verifyBetterAuthIdentityAssertion(
				sign(claims({ exp: NOW_SECONDS + 121 })),
				verifierOptions
			),
		INVALID_LIFETIME
	);
});
