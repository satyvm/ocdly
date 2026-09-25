import type { OtpDelivery } from "@ocdly/auth";

const GRAPH_API_VERSION = "v26.0";
const PHONE_NUMBER_ID_PATTERN = /^\d+$/;
const TEMPLATE_NAME_PATTERN = /^[a-z0-9_]+$/;
const TEMPLATE_LANGUAGE_PATTERN = /^[a-z]{2}(?:_[A-Z]{2})?$/;
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const OTP_PATTERN = /^\d{6}$/;

export interface WhatsAppConfig {
	accessToken?: string;
	phoneNumberId?: string;
	templateLanguage?: string;
	templateName?: string;
}

export interface OtpDeliveryConfig {
	nodeEnv: "development" | "production" | "test";
	provider?: "disabled" | "dev-console" | "whatsapp";
	whatsapp?: WhatsAppConfig;
}

function configuredWhatsApp(config: WhatsAppConfig | undefined) {
	if (
		!(
			config?.accessToken &&
			config.phoneNumberId &&
			PHONE_NUMBER_ID_PATTERN.test(config.phoneNumberId) &&
			config.templateName &&
			TEMPLATE_NAME_PATTERN.test(config.templateName) &&
			config.templateLanguage &&
			TEMPLATE_LANGUAGE_PATTERN.test(config.templateLanguage)
		)
	) {
		throw new Error(
			"WhatsApp OTP requires an access token, phone number ID, approved template name and language"
		);
	}
	return {
		accessToken: config.accessToken,
		phoneNumberId: config.phoneNumberId,
		templateLanguage: config.templateLanguage,
		templateName: config.templateName,
	};
}

export function createOtpDelivery(
	config: OtpDeliveryConfig,
	request: typeof fetch = fetch
): OtpDelivery {
	if (config.provider === "dev-console") {
		if (config.nodeEnv === "production") {
			throw new Error("OTP_PROVIDER=dev-console is forbidden in production");
		}

		return {
			send({ phoneNumber, code }) {
				console.info(`[ocdly otp] ${phoneNumber}: ${code}`);
				return Promise.resolve();
			},
		};
	}

	if (config.provider === "whatsapp") {
		const whatsapp = configuredWhatsApp(config.whatsapp);
		return {
			async send({ phoneNumber, code }) {
				if (!(E164_PHONE_PATTERN.test(phoneNumber) && OTP_PATTERN.test(code))) {
					throw new Error("WhatsApp OTP recipient or code is invalid");
				}
				const response = await request(
					`https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsapp.phoneNumberId}/messages`,
					{
						body: JSON.stringify({
							messaging_product: "whatsapp",
							template: {
								components: [
									{
										parameters: [{ text: code, type: "text" }],
										type: "body",
									},
									{
										index: "0",
										parameters: [{ text: code, type: "text" }],
										sub_type: "url",
										type: "button",
									},
								],
								language: { code: whatsapp.templateLanguage },
								name: whatsapp.templateName,
							},
							to: phoneNumber.slice(1),
							type: "template",
						}),
						headers: {
							Authorization: `Bearer ${whatsapp.accessToken}`,
							"Content-Type": "application/json",
						},
						method: "POST",
						signal: AbortSignal.timeout(8000),
					}
				);
				if (!response.ok) {
					const failure: unknown = await response.json().catch(() => null);
					const metaCode =
						typeof failure === "object" &&
						failure !== null &&
						"error" in failure &&
						typeof failure.error === "object" &&
						failure.error !== null &&
						"code" in failure.error &&
						typeof failure.error.code === "number"
							? `, Meta code ${failure.error.code}`
							: "";
					throw new Error(
						`WhatsApp OTP request failed (HTTP ${response.status}${metaCode})`
					);
				}
				const result: unknown = await response.json();
				if (
					typeof result !== "object" ||
					result === null ||
					!("messages" in result) ||
					!Array.isArray(result.messages) ||
					!result.messages[0]?.id
				) {
					throw new Error("WhatsApp did not accept the OTP message");
				}
			},
		};
	}

	return {
		send() {
			return Promise.reject(
				new Error(
					"OTP delivery is disabled. Configure WhatsApp before enabling phone sign-in."
				)
			);
		},
	};
}
