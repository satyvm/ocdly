import type { Category, Product } from "./catalog";

export interface VendureAsset {
	preview: string;
}

export interface VendureFacetValue {
	code: string;
	facet: {
		code: string;
	};
	name: string;
}

export interface VendureOption {
	code: string;
	group: {
		code: string;
		name: string;
	};
	name: string;
}

export interface VendureVariant {
	currencyCode: string;
	featuredAsset: VendureAsset | null;
	id: string;
	name: string;
	options: VendureOption[];
	priceWithTax: number;
	sku: string;
}

export interface VendureProduct {
	assets: VendureAsset[];
	description: string;
	facetValues: VendureFacetValue[];
	featuredAsset: VendureAsset | null;
	id: string;
	name: string;
	slug: string;
	variants: VendureVariant[];
}

export interface VendureProductsData {
	products: {
		items: VendureProduct[];
		totalItems: number;
	};
}

export interface VendureProductData {
	product: VendureProduct | null;
}

const DEFAULT_IMAGE = "/images/ocdly-editorial.jpg";
const SIZE_GROUP_CODES = new Set(["size", "sizes"]);
const COLOR_GROUP_CODES = new Set(["color", "colour", "colors", "colours"]);
const T_SHIRT_CATEGORY = /\bt[ -]?shirts?\b|\btees?\b/;

export class VendureCatalogError extends Error {
	readonly code: "configuration" | "network" | "response";

	constructor(
		code: VendureCatalogError["code"],
		message: string,
		options?: ErrorOptions
	) {
		super(message, options);
		this.name = "VendureCatalogError";
		this.code = code;
	}

	static from(
		code: VendureCatalogError["code"],
		message: string,
		cause: unknown
	) {
		return new VendureCatalogError(code, message, { cause });
	}
}

function unique(values: string[]) {
	return [...new Set(values.filter(Boolean))];
}

function resolveAssetUrl(preview: string | undefined, assetBaseUrl: string) {
	if (!preview) {
		return DEFAULT_IMAGE;
	}
	try {
		return new URL(preview, assetBaseUrl).toString();
	} catch {
		return DEFAULT_IMAGE;
	}
}

function findOptions(product: VendureProduct, groupCodes: Set<string>) {
	return unique(
		product.variants.flatMap((variant) =>
			variant.options
				.filter((option) => groupCodes.has(option.group.code.toLowerCase()))
				.map((option) => option.name)
		)
	);
}

function facetText(product: VendureProduct) {
	return product.facetValues
		.map((value) => `${value.facet.code} ${value.code} ${value.name}`)
		.join(" ")
		.toLowerCase();
}

function productCategory(product: VendureProduct): Exclude<Category, "All"> {
	const values = facetText(product);
	if (T_SHIRT_CATEGORY.test(values)) {
		return "T-shirts";
	}
	return "Shirts";
}

function productColor(product: VendureProduct) {
	const colors = findOptions(product, COLOR_GROUP_CODES);
	if (colors.length > 0) {
		return colors.join(" / ");
	}
	const colorFacet = product.facetValues.find((value) =>
		COLOR_GROUP_CODES.has(value.facet.code.toLowerCase())
	);
	return colorFacet?.name ?? "Natural";
}

function colorSwatch(color: string) {
	const normalized = color.toLowerCase();
	if (normalized.includes("black")) {
		return "#252525";
	}
	if (normalized.includes("white")) {
		return "#e9e7df";
	}
	if (normalized.includes("blue")) {
		return "#71869b";
	}
	if (normalized.includes("green")) {
		return "#73806f";
	}
	return "#c8c0ae";
}

export function mapVendureProduct(
	product: VendureProduct,
	assetBaseUrl: string
): Product {
	const variants = product.variants.filter(
		(variant) =>
			Number.isFinite(variant.priceWithTax) && variant.priceWithTax >= 0
	);
	if (variants.length === 0) {
		throw new VendureCatalogError(
			"response",
			`Vendure product ${product.slug || product.id} has no priced variants`
		);
	}
	const [firstVariant] = variants;
	if (!firstVariant) {
		throw new VendureCatalogError("response", "Vendure returned no variant");
	}
	const featured =
		product.featuredAsset?.preview ?? firstVariant.featuredAsset?.preview;
	const assetPreviews = unique([
		featured ?? "",
		...product.assets.map((asset) => asset.preview),
	]);
	const color = productColor(product);
	return {
		alternate: resolveAssetUrl(
			assetPreviews[1] ?? assetPreviews[0],
			assetBaseUrl
		),
		category: productCategory(product),
		color,
		currencyCode: firstVariant.currencyCode || "INR",
		description: product.description,
		id: product.slug,
		image: resolveAssetUrl(assetPreviews[0], assetBaseUrl),
		name: product.name,
		price: Math.min(...variants.map((variant) => variant.priceWithTax)),
		sizes: findOptions(product, SIZE_GROUP_CODES),
		swatch: colorSwatch(color),
		vendureId: product.id,
	};
}

export function mapVendureProducts(
	products: readonly VendureProduct[],
	assetBaseUrl: string
) {
	return products.map((product) => mapVendureProduct(product, assetBaseUrl));
}

export function assertProductsData(value: unknown): VendureProductsData {
	if (
		typeof value !== "object" ||
		value === null ||
		!("products" in value) ||
		typeof value.products !== "object" ||
		value.products === null ||
		!("items" in value.products) ||
		!Array.isArray(value.products.items)
	) {
		throw new VendureCatalogError(
			"response",
			"Vendure returned an invalid products response"
		);
	}
	return value as VendureProductsData;
}

export function assertProductData(value: unknown): VendureProductData {
	if (
		typeof value !== "object" ||
		value === null ||
		!("product" in value) ||
		(value.product !== null && typeof value.product !== "object")
	) {
		throw new VendureCatalogError(
			"response",
			"Vendure returned an invalid product response"
		);
	}
	return value as VendureProductData;
}
