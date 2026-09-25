import { describe, expect, test } from "bun:test";

import { createOtpDelivery } from "./otp-delivery";

describe("OTP delivery", () => {
	test("sends the approved WhatsApp authentication template", async () => {
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
				Response.json({ messages: [{ id: "wamid.123" }] })
			);
		}) as unknown as typeof fetch;
		const delivery = createOtpDelivery(
			{
				nodeEnv: "production",
				provider: "whatsapp",
				whatsapp: {
					accessToken: "test-access-token",
					phoneNumberId: "123456789",
					templateLanguage: "en_US",
					templateName: "ocdly_login_code",
				},
			},
			mockFetch
		);
		await delivery.send({ code: "123456", phoneNumber: "+919876543210" });
		expect(requests[0]?.input).toBe(
			"https://graph.facebook.com/v26.0/123456789/messages"
		);
		expect(JSON.parse(requests[0]?.init?.body as string)).toMatchObject({
			template: {
				components: [
					{ parameters: [{ text: "123456" }] },
					{ parameters: [{ text: "123456" }], sub_type: "url" },
				],
				name: "ocdly_login_code",
			},
			to: "919876543210",
		});
	});

	test("requires complete WhatsApp configuration", () => {
		expect(() =>
			createOtpDelivery({ nodeEnv: "production", provider: "whatsapp" })
		).toThrow("requires an access token");
	});

	test("rejects the console transport in production", () => {
		expect(() =>
			createOtpDelivery({ nodeEnv: "production", provider: "dev-console" })
		).toThrow("forbidden in production");
	});

	test("fails closed when no transport is configured", async () => {
		const delivery = createOtpDelivery({
			nodeEnv: "production",
			provider: "disabled",
		});
		await expect(
			delivery.send({ code: "123456", phoneNumber: "+919876543210" })
		).rejects.toThrow("OTP delivery is disabled");
	});
});
