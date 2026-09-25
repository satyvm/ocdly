import { createServerFn } from "@tanstack/react-start";

import {
	previewProductBySlug,
	previewProducts,
} from "@/lib/catalog-preview.server";
import { VendureCatalogError } from "@/lib/vendure-catalog";
import { vendureCatalogClientFromEnvironment } from "@/lib/vendure-catalog.server";

function mayUsePreviewCatalog() {
	return (
		!process.env.VENDURE_SHOP_API_URL && process.env.NODE_ENV !== "production"
	);
}

function requireProductionEndpoint() {
	if (
		!process.env.VENDURE_SHOP_API_URL &&
		process.env.NODE_ENV === "production"
	) {
		throw new VendureCatalogError(
			"configuration",
			"VENDURE_SHOP_API_URL is required in production"
		);
	}
}

export const getStoreCatalog = createServerFn({ method: "GET" }).handler(
	async () => {
		requireProductionEndpoint();
		try {
			return await vendureCatalogClientFromEnvironment().listProducts();
		} catch (error) {
			if (mayUsePreviewCatalog()) {
				return previewProducts;
			}
			throw error;
		}
	}
);

export const getStoreProduct = createServerFn({ method: "GET" })
	.validator((slug: string) => slug.trim().slice(0, 200))
	.handler(async ({ data: slug }) => {
		if (!slug) {
			return null;
		}
		requireProductionEndpoint();
		try {
			return await vendureCatalogClientFromEnvironment().productBySlug(slug);
		} catch (error) {
			if (mayUsePreviewCatalog()) {
				return previewProductBySlug(slug);
			}
			throw error;
		}
	});
