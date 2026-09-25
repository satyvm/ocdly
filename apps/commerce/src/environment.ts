import "dotenv/config";

type EnvironmentSource = Record<string, string | undefined>;

function requiredInProduction(
	source: EnvironmentSource,
	isProduction: boolean,
	name: string,
	developmentValue: string
): string {
	const value = source[name]?.trim();
	if (value) {
		return value;
	}
	if (isProduction) {
		throw new Error(`${name} is required in production`);
	}
	return developmentValue;
}

function integer(
	source: EnvironmentSource,
	name: string,
	fallback: number
): number {
	const raw = source[name];
	if (!raw) {
		return fallback;
	}
	const value = Number.parseInt(raw, 10);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(`${name} must be a positive integer`);
	}
	return value;
}

function boolean(
	source: EnvironmentSource,
	name: string,
	fallback: boolean
): boolean {
	const raw = source[name]?.toLowerCase();
	if (!raw) {
		return fallback;
	}
	if (raw === "true") {
		return true;
	}
	if (raw === "false") {
		return false;
	}
	throw new Error(`${name} must be true or false`);
}

function corsOrigins(
	source: EnvironmentSource,
	isProduction: boolean
): true | string[] {
	const raw = source.VENDURE_CORS_ORIGINS;
	if (!raw) {
		return isProduction ? [] : true;
	}
	return raw
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

export function loadEnvironment(source: EnvironmentSource = process.env) {
	const isProduction = source.NODE_ENV === "production";
	const cookieSecret = requiredInProduction(
		source,
		isProduction,
		"COOKIE_SECRET",
		"change-this-cookie-secret-before-production-32-chars"
	);
	if (cookieSecret.length < 32) {
		throw new Error("COOKIE_SECRET must contain at least 32 characters");
	}
	const identitySecret = source.VENDURE_IDENTITY_SECRET?.trim() || undefined;
	if (identitySecret && Buffer.byteLength(identitySecret) < 32) {
		throw new Error("VENDURE_IDENTITY_SECRET must contain at least 32 bytes");
	}

	return {
		assetUrl: source.VENDURE_ASSET_URL,
		channelToken: requiredInProduction(
			source,
			isProduction,
			"VENDURE_CHANNEL_TOKEN",
			"ocdly-web"
		),
		cookieSecret,
		corsOrigins: corsOrigins(source, isProduction),
		database: {
			host: source.DB_HOST ?? "127.0.0.1",
			name: source.DB_NAME ?? "ocdly_commerce",
			password: requiredInProduction(
				source,
				isProduction,
				"DB_PASSWORD",
				"password"
			),
			port: integer(source, "DB_PORT", 5433),
			schema: source.DB_SCHEMA ?? "public",
			ssl: boolean(source, "DB_SSL", false),
			username: source.DB_USERNAME ?? "postgres",
		},
		host: source.VENDURE_HOST ?? "0.0.0.0",
		identitySecret,
		isProduction,
		port: integer(source, "VENDURE_PORT", 3050),
		superadmin: {
			identifier: requiredInProduction(
				source,
				isProduction,
				"SUPERADMIN_USERNAME",
				"admin@ocdly.local"
			),
			password: requiredInProduction(
				source,
				isProduction,
				"SUPERADMIN_PASSWORD",
				"change-me-before-production"
			),
		},
	};
}

export const environment = loadEnvironment();
