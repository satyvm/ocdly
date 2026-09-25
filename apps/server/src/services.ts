import { createAuth } from "@ocdly/auth";
import { createDb } from "@ocdly/db";

import { ENV } from "./env.server";
import { createOtpDelivery } from "./otp-delivery";

export const db = createDb(ENV);
export const auth = createAuth(
	ENV,
	db,
	[],
	createOtpDelivery({
		nodeEnv: ENV.NODE_ENV,
		provider: ENV.OTP_PROVIDER,
		whatsapp: {
			accessToken: ENV.WHATSAPP_ACCESS_TOKEN,
			phoneNumberId: ENV.WHATSAPP_PHONE_NUMBER_ID,
			templateLanguage: ENV.WHATSAPP_OTP_TEMPLATE_LANGUAGE,
			templateName: ENV.WHATSAPP_OTP_TEMPLATE_NAME,
		},
	})
);
