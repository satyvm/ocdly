import { describe, expect, test } from "bun:test";
import {
	linkCommerceCustomer,
	signCommerceIdentityAssertion,
} from "./commerce-identity";

const SECRET = "0123456789abcdef0123456789abcdef";
const IDENTITY = {
	email: "person@example.com",
	emailVerified: true,
	id: "auth-user-1",
	name: "Asha Example",
	phoneNumber: "+919876543210",
	phoneNumberVerified: true,
};

describe("commerce identity bridge", () => {
	test("signs a short-lived assertion for a verified phone", () => {
		const assertion = signCommerceIdentityAssertion(
			IDENTITY,
			SECRET,
			1_800_000_000_000
		);
		const [header, body] = assertion.split(".");
		expect(
			JSON.parse(Buffer.from(header ?? "", "base64url").toString())
		).toEqual({
			alg: "HS256",
			typ: "JWT",
		});
		expect(
			JSON.parse(Buffer.from(body ?? "", "base64url").toString())
		).toMatchObject({
			aud: "ocdly-vendure",
			exp: 1_800_000_060,
			iat: 1_800_000_000,
			iss: "ocdly-api",
			phone_number: "+919876543210",
			phone_number_verified: true,
			sub: "auth-user-1",
		});
	});

	test("refuses unverified phone identities", () => {
		expect(() =>
			signCommerceIdentityAssertion(
				{ ...IDENTITY, phoneNumberVerified: false },
				SECRET
			)
		).toThrow("verified phone number");
	});

	test("authenticates the customer through Vendure with the channel token", async () => {
		const requests: Array<{
			input: Parameters<typeof fetch>[0];
			init?: RequestInit;
		}> = [];
		const mockFetch = ((
			input: Parameters<typeof fetch>[0],
			init?: RequestInit
		) => {
			requests.push({ init, input });
			return Promise.resolve(
				Response.json({
					data: {
						authenticate: { __typename: "CurrentUser", id: "vendure-user-1" },
					},
				})
			);
		}) as unknown as typeof fetch;
		const result = await linkCommerceCustomer(
			IDENTITY,
			{
				channelToken: "shop-channel",
				identitySecret: SECRET,
				shopApiUrl: "https://commerce.example/shop-api",
			},
			mockFetch
		);
		expect(result).toBe("vendure-user-1");
		expect(requests).toHaveLength(1);
		expect(requests[0]?.input).toBe("https://commerce.example/shop-api");
		expect(requests[0]?.init?.headers).toMatchObject({
			"vendure-token": "shop-channel",
		});
	});

	test("rejects a failed Vendure authentication", async () => {
		const mockFetch = (() =>
			Promise.resolve(
				Response.json({
					data: { authenticate: { __typename: "InvalidCredentialsError" } },
				})
			)) as unknown as typeof fetch;
		await expect(
			linkCommerceCustomer(
				IDENTITY,
				{
					channelToken: "shop-channel",
					identitySecret: SECRET,
					shopApiUrl: "https://commerce.example/shop-api",
				},
				mockFetch
			)
		).rejects.toThrow("did not authenticate");
	});
});
