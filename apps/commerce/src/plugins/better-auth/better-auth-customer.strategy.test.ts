import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import type { CustomerService, RequestContext, User } from "@vendure/core";
import { BetterAuthCustomerStrategy } from "./better-auth-customer.strategy";

const SECRET = "0123456789abcdef0123456789abcdef";
const NOW_SECONDS = 1_800_000_000;
const context = {} as RequestContext;
const SYNTHETIC_EMAIL_PATTERN = /^[a-f0-9]{40}@customers\.ocdly\.invalid$/;

function assertion(overrides: Record<string, unknown> = {}) {
	const header = Buffer.from(
		JSON.stringify({ alg: "HS256", typ: "JWT" })
	).toString("base64url");
	const payload = Buffer.from(
		JSON.stringify({
			aud: "ocdly-vendure",
			exp: NOW_SECONDS + 60,
			iat: NOW_SECONDS,
			iss: "https://identity.ocdly.com",
			phone_number: "+919876543210",
			phone_number_verified: true,
			sub: "better-auth-user-1",
			...overrides,
		})
	).toString("base64url");
	const signature = createHmac("sha256", SECRET)
		.update(`${header}.${payload}`)
		.digest("base64url");
	return `${header}.${payload}.${signature}`;
}

function setup(existingUser?: User) {
	const createdUser = { id: "new-user" } as User;
	const calls: Record<string, unknown>[] = [];
	const customer = { id: "customer-1", phoneNumber: "" };
	const customerService = {
		findOneByUserId: () => Promise.resolve(customer),
		update: (_ctx: RequestContext, input: Record<string, unknown>) => {
			calls.push(input);
			customer.phoneNumber = input.phoneNumber as string;
			return Promise.resolve(customer);
		},
	} as unknown as CustomerService;
	const externalAuthenticationService = {
		createCustomerAndUser: (
			_ctx: RequestContext,
			config: Record<string, unknown>
		) => {
			calls.push(config);
			return Promise.resolve(createdUser);
		},
		findCustomerUser: () => Promise.resolve(existingUser),
	};
	const strategy = new BetterAuthCustomerStrategy(
		{
			audience: "ocdly-vendure",
			issuer: "https://identity.ocdly.com",
			now: () => NOW_SECONDS * 1000,
			secret: SECRET,
		},
		externalAuthenticationService,
		customerService
	);
	return { calls, createdUser, strategy };
}

test("returns an existing customer linked by the stable Better Auth user id", async () => {
	const existingUser = { id: "existing-user" } as User;
	const { calls, strategy } = setup(existingUser);

	const result = await strategy.authenticate(context, {
		assertion: assertion(),
	});

	assert.equal(result, existingUser);
	assert.deepEqual(calls, [{ id: "customer-1", phoneNumber: "+919876543210" }]);
});

test("creates a customer with a verified email and identity link", async () => {
	const { calls, createdUser, strategy } = setup();

	const result = await strategy.authenticate(context, {
		assertion: assertion({
			email: "CUSTOMER@example.com",
			email_verified: true,
			family_name: "Sharma",
			given_name: "Aarav",
		}),
	});

	assert.equal(result, createdUser);
	assert.deepEqual(calls, [
		{
			emailAddress: "customer@example.com",
			externalIdentifier: "better-auth-user-1",
			firstName: "Aarav",
			lastName: "Sharma",
			strategy: "better_auth",
			verified: true,
		},
		{ id: "customer-1", phoneNumber: "+919876543210" },
	]);
});

test("uses a deterministic non-routable email when email is not verified", async () => {
	const { calls, strategy } = setup();

	await strategy.authenticate(context, {
		assertion: assertion({ email: "unverified@example.com" }),
	});

	assert.match(calls[0]?.emailAddress as string, SYNTHETIC_EMAIL_PATTERN);
	assert.equal(calls[0]?.verified, true);
});

test("does not query or create a customer for an invalid assertion", async () => {
	let lookupCount = 0;
	const strategy = new BetterAuthCustomerStrategy(
		{
			audience: "ocdly-vendure",
			issuer: "https://identity.ocdly.com",
			now: () => NOW_SECONDS * 1000,
			secret: SECRET,
		},
		{
			createCustomerAndUser: () => Promise.reject(new Error("must not create")),
			findCustomerUser: () => {
				lookupCount += 1;
				return Promise.resolve<User | undefined>(undefined);
			},
		},
		{
			findOneByUserId: () => Promise.resolve(undefined),
			update: () => Promise.reject(new Error("must not update")),
		} as unknown as CustomerService
	);

	const result = await strategy.authenticate(context, {
		assertion: `${assertion()}tampered`,
	});

	assert.equal(result, false);
	assert.equal(lookupCount, 0);
});
