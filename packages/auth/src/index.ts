import type { Database } from "@ocdly/db";
import {
	account,
	accountRelations,
	rateLimit,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
} from "@ocdly/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins/phone-number";

const authSchema = {
	account,
	accountRelations,
	rateLimit,
	session,
	sessionRelations,
	user,
	userRelations,
	verification,
};
const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;

export interface OtpDelivery {
	send: (input: { phoneNumber: string; code: string }) => Promise<void>;
}

export interface AuthConfig {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
}

const missingOtpDelivery: OtpDelivery = {
	send: () => Promise.reject(new Error("OTP delivery is not configured")),
};

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = [],
	otpDelivery: OtpDelivery = missingOtpDelivery
) {
	const usesHttps = new URL(env.BETTER_AUTH_URL).protocol === "https:";

	return betterAuth({
		advanced: {
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: "lax",
				secure: usesHttps,
			},
		},
		baseURL: env.BETTER_AUTH_URL,
		database: drizzleAdapter(database, {
			provider: "pg",
			schema: authSchema,
		}),
		emailAndPassword: { enabled: true },
		plugins: [
			phoneNumber({
				allowedAttempts: 3,
				expiresIn: 300,
				otpLength: 6,
				phoneNumberValidator: (value) => PHONE_NUMBER_PATTERN.test(value),
				sendOTP: ({ phoneNumber: value, code }) =>
					otpDelivery.send({ code, phoneNumber: value }),
				signUpOnVerification: {
					getTempEmail: (value) => `${value.slice(1)}@phone.ocdly.invalid`,
					getTempName: () => "ocdly member",
				},
			}),
		],
		rateLimit: {
			customRules: {
				"/phone-number/send-otp": { max: 3, window: 60 },
				"/phone-number/verify": { max: 5, window: 60 },
			},
			enabled: true,
			max: 60,
			storage: "database",
			window: 60,
		},
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.CORS_ORIGIN, ...desktopOrigins],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
