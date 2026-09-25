import path from "node:path";
import { pathToFileURL } from "node:url";
import { vendureDashboardPlugin } from "@vendure/dashboard/vite";
import { defineConfig } from "vite";

const packageRoot = import.meta.dirname;

export default defineConfig({
	base: "/dashboard/",
	build: {
		emptyOutDir: false,
		outDir: path.join(packageRoot, "dist/dashboard"),
	},
	plugins: [
		vendureDashboardPlugin({
			api: {
				adminApiPath: "admin-api",
				host: "auto",
				port: "auto",
				tokenMethod: "cookie",
			},
			gqlOutputPath: path.join(packageRoot, "src/gql"),
			tanstackRouterPluginOptions: {
				tmpDir: path.join(packageRoot, ".tanstack-tmp"),
			},
			theme: {
				dark: {
					brand: "#d8d1c4",
					"brand-lighter": "#eee9df",
					primary: "oklch(0.82 0.02 80)",
				},
				light: {
					brand: "#252525",
					"brand-lighter": "#716b61",
					primary: "oklch(0.28 0.015 75)",
				},
			},
			useExperimentalBundle: true,
			vendureConfigPath: pathToFileURL(
				path.join(packageRoot, "src/vendure-config.ts")
			),
		}),
	],
});
