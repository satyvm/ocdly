import { initLogger } from "evlog";
import { createAxiomDrain } from "evlog/axiom";
import {
	type BetterAuthInstance,
	createAuthMiddleware,
} from "evlog/better-auth";
import { type EvlogVariables, evlog } from "evlog/hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { linkCommerceCustomer } from "./commerce-identity";
import { ENV } from "./env.server";
import { auth } from "./services";

initLogger({
	env: { service: "ocdly-server" },
});

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
	exclude: ["/api/auth/**"],
	maskEmail: true,
});

const app = new Hono<EvlogVariables>();

app.use(evlog({ drain: createAxiomDrain() }));
app.use("*", async (c, next) => {
	await identifyUser(c.get("log"), c.req.raw.headers, c.req.path);
	await next();
});

app.use(
	"/*",
	cors({
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		credentials: true,
		origin: ENV.CORS_ORIGIN,
	})
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => auth.handler(c.req.raw));

app.post("/api/commerce/customer", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session) {
		return c.json({ error: "Sign in first" }, 401);
	}
	if (!(session.user.phoneNumberVerified && session.user.phoneNumber)) {
		return c.json({ error: "Verify your phone number first" }, 403);
	}
	if (
		!(
			ENV.VENDURE_IDENTITY_SECRET &&
			ENV.VENDURE_SHOP_API_URL &&
			ENV.VENDURE_CHANNEL_TOKEN
		)
	) {
		return c.json({ error: "Commerce identity is not configured" }, 503);
	}

	try {
		const commerceUserId = await linkCommerceCustomer(session.user, {
			channelToken: ENV.VENDURE_CHANNEL_TOKEN,
			identitySecret: ENV.VENDURE_IDENTITY_SECRET,
			shopApiUrl: ENV.VENDURE_SHOP_API_URL,
		});
		return c.json({ commerceUserId });
	} catch (error) {
		console.error("Could not link commerce customer", error);
		return c.json({ error: "Could not connect your commerce account" }, 502);
	}
});

app.get("/", (c) => c.text("OK"));

export default app;
