// biome-ignore-all lint/correctness/noGlobalDirnameFilename: Vendure compiles this service as CommonJS.
import path from "node:path";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import {
	DefaultJobQueuePlugin,
	DefaultSchedulerPlugin,
	DefaultSearchPlugin,
	dummyPaymentHandler,
	type VendureConfig,
} from "@vendure/core";
import { DashboardPlugin } from "@vendure/dashboard/plugin";
import { GraphiqlPlugin } from "@vendure/graphiql-plugin";
import { fashionCustomFields } from "./catalog/custom-fields";
import { environment } from "./environment";
import { createBetterAuthCustomerPlugin } from "./plugins/better-auth/better-auth-customer.plugin";
import { HealthPlugin } from "./plugins/health/health.plugin";

const graphiqlPlugins = environment.isProduction ? [] : [GraphiqlPlugin.init()];
const identityPlugins = environment.identitySecret
	? [
			createBetterAuthCustomerPlugin({
				audience: "ocdly-vendure",
				issuer: "ocdly-api",
				secret: environment.identitySecret,
			}),
		]
	: [];

export const config: VendureConfig = {
	apiOptions: {
		adminApiDebug: !environment.isProduction,
		adminApiPath: "admin-api",
		channelTokenKey: "vendure-token",
		cors: {
			credentials: true,
			origin: environment.corsOrigins,
		},
		hostname: environment.host,
		port: environment.port,
		shopApiDebug: !environment.isProduction,
		shopApiPath: "shop-api",
		trustProxy: environment.isProduction ? 1 : false,
	},
	authOptions: {
		cookieOptions: {
			sameSite: "lax",
			secret: environment.cookieSecret,
			secure: environment.isProduction,
		},
		superadminCredentials: environment.superadmin,
		tokenMethod: ["bearer", "cookie"],
	},
	customFields: fashionCustomFields,
	dbConnectionOptions: {
		database: environment.database.name,
		host: environment.database.host,
		logging: false,
		migrations: [path.join(__dirname, "./migrations/*.+(js|ts)")],
		migrationsRun: false,
		password: environment.database.password,
		port: environment.database.port,
		schema: environment.database.schema,
		ssl: environment.database.ssl ? { rejectUnauthorized: true } : false,
		synchronize: false,
		type: "postgres",
		username: environment.database.username,
	},
	defaultChannelToken: environment.channelToken,
	importExportOptions: {
		importAssetsDir: path.join(__dirname, "../seed/assets"),
	},
	paymentOptions: {
		paymentMethodHandlers: [dummyPaymentHandler],
	},
	plugins: [
		...graphiqlPlugins,
		...identityPlugins,
		HealthPlugin,
		DashboardPlugin.init({
			appDir: path.join(__dirname, "dashboard"),
			route: "dashboard",
		}),
		AssetServerPlugin.init({
			assetUploadDir: path.join(__dirname, "../static/assets"),
			assetUrlPrefix: environment.assetUrl,
			route: "assets",
		}),
		DefaultSchedulerPlugin.init(),
		DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
		DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
	],
};
