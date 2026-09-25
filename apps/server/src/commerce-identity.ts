import { createHmac } from "node:crypto";

const ISSUER = "ocdly-api";
const AUDIENCE = "ocdly-vendure";
const ASSERTION_LIFETIME_SECONDS = 60;
const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;

export interface VerifiedCommerceIdentity {
	email?: string;
	emailVerified?: boolean;
	id: string;
	name?: string;
	phoneNumber?: string | null;
	phoneNumberVerified?: boolean | null;
}

export interface CommerceIdentityConfig {
	channelToken: string;
	identitySecret: string;
	shopApiUrl: string;
}

export function signCommerceIdentityAssertion(
	identity: VerifiedCommerceIdentity,
	secret: string,
	now = Date.now()
): string {
	if (
		identity.phoneNumberVerified !== true ||
		!identity.phoneNumber ||
		!PHONE_NUMBER_PATTERN.test(identity.phoneNumber)
	) {
		throw new Error("A verified phone number is required");
	}
	if (Buffer.byteLength(secret) < 32) {
		throw new Error("VENDURE_IDENTITY_SECRET must contain at least 32 bytes");
	}

	const issuedAt = Math.floor(now / 1000);
	const header = Buffer.from(
		JSON.stringify({ alg: "HS256", typ: "JWT" })
	).toString("base64url");
	const claims = {
		aud: AUDIENCE,
		...(identity.email && identity.emailVerified
			? { email: identity.email, email_verified: true }
			: {}),
		exp: issuedAt + ASSERTION_LIFETIME_SECONDS,
		iat: issuedAt,
		iss: ISSUER,
		name: identity.name,
		phone_number: identity.phoneNumber,
		phone_number_verified: true,
		sub: identity.id,
	};
	const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
	const signature = createHmac("sha256", secret)
		.update(`${header}.${payload}`)
		.digest("base64url");
	return `${header}.${payload}.${signature}`;
}

export async function linkCommerceCustomer(
	identity: VerifiedCommerceIdentity,
	config: CommerceIdentityConfig,
	request: typeof fetch = fetch
): Promise<string> {
	const assertion = signCommerceIdentityAssertion(
		identity,
		config.identitySecret
	);
	const response = await request(config.shopApiUrl, {
		body: JSON.stringify({
			query:
				"mutation LinkCustomer($assertion: String!) { authenticate(input: { better_auth: { assertion: $assertion } }) { __typename ... on CurrentUser { id } } }",
			variables: { assertion },
		}),
		headers: {
			"content-type": "application/json",
			"vendure-token": config.channelToken,
		},
		method: "POST",
		signal: AbortSignal.timeout(5000),
	});
	if (!response.ok) {
		throw new Error(`Vendure identity request failed (${response.status})`);
	}
	const result: unknown = await response.json();
	if (
		typeof result !== "object" ||
		result === null ||
		!("data" in result) ||
		typeof result.data !== "object" ||
		result.data === null ||
		!("authenticate" in result.data) ||
		typeof result.data.authenticate !== "object" ||
		result.data.authenticate === null ||
		!("__typename" in result.data.authenticate) ||
		result.data.authenticate.__typename !== "CurrentUser" ||
		!("id" in result.data.authenticate) ||
		typeof result.data.authenticate.id !== "string"
	) {
		throw new Error("Vendure did not authenticate the linked customer");
	}
	return result.data.authenticate.id;
}
