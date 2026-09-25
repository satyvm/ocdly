import { createHmac, timingSafeEqual } from "node:crypto";

const ASSERTION_ALGORITHM = "HS256";
const ASSERTION_TYPE = "JWT";
const DEFAULT_CLOCK_TOLERANCE_SECONDS = 5;
const DEFAULT_MAX_LIFETIME_SECONDS = 120;
const MAX_ASSERTION_LENGTH = 8192;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;

export type IdentityAssertionErrorCode =
	| "invalid_format"
	| "invalid_signature"
	| "invalid_claims"
	| "expired";

export class IdentityAssertionError extends Error {
	readonly code: IdentityAssertionErrorCode;

	constructor(code: IdentityAssertionErrorCode, message: string) {
		super(message);
		this.name = "IdentityAssertionError";
		this.code = code;
	}
}

export interface BetterAuthIdentityClaims {
	aud: string | string[];
	email?: string;
	email_verified?: boolean;
	exp: number;
	family_name?: string;
	given_name?: string;
	iat: number;
	iss: string;
	name?: string;
	phone_number: string;
	phone_number_verified: true;
	sub: string;
}

export interface IdentityAssertionVerifierOptions {
	audience: string;
	clockToleranceSeconds?: number;
	issuer: string;
	maxLifetimeSeconds?: number;
	now?: () => number;
	secret: string | Buffer;
}

interface AssertionHeader {
	alg: string;
	typ: string;
}

function assertionError(
	code: IdentityAssertionErrorCode,
	message: string
): never {
	throw new IdentityAssertionError(code, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodePart(part: string): unknown {
	if (!(part && BASE64URL_PATTERN.test(part))) {
		assertionError("invalid_format", "Assertion is not valid base64url");
	}

	try {
		return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
	} catch {
		return assertionError("invalid_format", "Assertion contains invalid JSON");
	}
}

function requiredString(
	claims: Record<string, unknown>,
	name: string,
	maxLength = 255
): string {
	const value = claims[name];
	if (typeof value !== "string" || !value || value.length > maxLength) {
		assertionError("invalid_claims", `Assertion claim ${name} is invalid`);
	}
	return value;
}

function requiredTimestamp(
	claims: Record<string, unknown>,
	name: string
): number {
	const value = claims[name];
	if (!Number.isSafeInteger(value) || (value as number) <= 0) {
		assertionError("invalid_claims", `Assertion claim ${name} is invalid`);
	}
	return value as number;
}

function optionalString(
	claims: Record<string, unknown>,
	name: string,
	maxLength: number
): string | undefined {
	const value = claims[name];
	if (value === undefined) {
		return undefined;
	}
	if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
		assertionError("invalid_claims", `Assertion claim ${name} is invalid`);
	}
	return value.trim();
}

function hasAudience(
	value: unknown,
	expected: string
): value is string | string[] {
	return (
		value === expected ||
		(Array.isArray(value) &&
			value.length > 0 &&
			value.every((entry) => typeof entry === "string") &&
			value.includes(expected))
	);
}

function validateOptions(options: IdentityAssertionVerifierOptions) {
	if (!(options.issuer.trim() && options.audience.trim())) {
		throw new Error("Identity assertion issuer and audience are required");
	}
	if (Buffer.byteLength(options.secret) < 32) {
		throw new Error("Identity assertion secret must contain at least 32 bytes");
	}
}

function validateClaims(
	value: unknown,
	options: IdentityAssertionVerifierOptions
): BetterAuthIdentityClaims {
	if (!isRecord(value)) {
		return assertionError("invalid_claims", "Assertion payload is invalid");
	}

	const issuer = requiredString(value, "iss");
	const subject = requiredString(value, "sub");
	const issuedAt = requiredTimestamp(value, "iat");
	const expiresAt = requiredTimestamp(value, "exp");
	const clockTolerance =
		options.clockToleranceSeconds ?? DEFAULT_CLOCK_TOLERANCE_SECONDS;
	const maxLifetime =
		options.maxLifetimeSeconds ?? DEFAULT_MAX_LIFETIME_SECONDS;
	const now = Math.floor((options.now?.() ?? Date.now()) / 1000);

	if (issuer !== options.issuer) {
		return assertionError("invalid_claims", "Assertion issuer is invalid");
	}
	if (!hasAudience(value.aud, options.audience)) {
		return assertionError("invalid_claims", "Assertion audience is invalid");
	}
	if (value.phone_number_verified !== true) {
		return assertionError("invalid_claims", "Phone number is not verified");
	}
	const phoneNumber = requiredString(value, "phone_number", 16);
	if (!PHONE_NUMBER_PATTERN.test(phoneNumber)) {
		return assertionError("invalid_claims", "Phone number is invalid");
	}
	if (issuedAt > now + clockTolerance) {
		return assertionError(
			"invalid_claims",
			"Assertion was issued in the future"
		);
	}
	if (expiresAt <= now - clockTolerance) {
		return assertionError("expired", "Assertion has expired");
	}
	if (expiresAt <= issuedAt || expiresAt - issuedAt > maxLifetime) {
		return assertionError("invalid_claims", "Assertion lifetime is invalid");
	}

	const email = optionalString(value, "email", 320);
	if (email && !email.includes("@")) {
		return assertionError("invalid_claims", "Assertion email is invalid");
	}
	if (
		value.email_verified !== undefined &&
		typeof value.email_verified !== "boolean"
	) {
		return assertionError(
			"invalid_claims",
			"Assertion email_verified is invalid"
		);
	}

	return {
		aud: value.aud,
		email,
		email_verified: value.email_verified as boolean | undefined,
		exp: expiresAt,
		family_name: optionalString(value, "family_name", 100),
		given_name: optionalString(value, "given_name", 100),
		iat: issuedAt,
		iss: issuer,
		name: optionalString(value, "name", 200),
		phone_number: phoneNumber,
		phone_number_verified: true,
		sub: subject,
	};
}

export function verifyBetterAuthIdentityAssertion(
	assertion: string,
	options: IdentityAssertionVerifierOptions
): BetterAuthIdentityClaims {
	validateOptions(options);
	if (!assertion || assertion.length > MAX_ASSERTION_LENGTH) {
		return assertionError("invalid_format", "Assertion length is invalid");
	}

	const parts = assertion.split(".");
	if (parts.length !== 3) {
		return assertionError("invalid_format", "Assertion must have three parts");
	}
	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	if (!(encodedHeader && encodedPayload && encodedSignature)) {
		return assertionError("invalid_format", "Assertion contains an empty part");
	}
	if (!BASE64URL_PATTERN.test(encodedSignature)) {
		return assertionError(
			"invalid_format",
			"Assertion signature is not base64url"
		);
	}

	const signature = Buffer.from(encodedSignature, "base64url");
	const expectedSignature = createHmac("sha256", options.secret)
		.update(`${encodedHeader}.${encodedPayload}`)
		.digest();
	if (
		signature.length !== expectedSignature.length ||
		!timingSafeEqual(signature, expectedSignature)
	) {
		return assertionError(
			"invalid_signature",
			"Assertion signature is invalid"
		);
	}

	const header = decodePart(encodedHeader);
	if (
		!isRecord(header) ||
		(header as unknown as AssertionHeader).alg !== ASSERTION_ALGORITHM ||
		(header as unknown as AssertionHeader).typ !== ASSERTION_TYPE
	) {
		return assertionError("invalid_format", "Assertion header is invalid");
	}

	return validateClaims(decodePart(encodedPayload), options);
}
