export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"] as const;

export type ApparelSize = (typeof APPAREL_SIZES)[number];

export interface ProductFashionFields {
	care: string;
	collection: string;
	composition: string;
	countryOfOrigin: string;
	dispatchWindow: string;
	fabric: string;
	fit: string;
	gsm: number;
	hsnCode: string;
	modelMeasurements: string;
	sizeChart: string;
}

export interface VariantInventoryPolicy {
	colourCode: string;
	outOfStockThreshold: number;
	preorderDispatchWindow?: string;
	preorderEnabled: boolean;
	preorderLeadTimeDays?: number;
	preorderLimit: number;
}

export interface CatalogueProductProfile {
	customFields: ProductFashionFields;
	slug: string;
	variants: Readonly<Record<string, VariantInventoryPolicy>>;
}

type InventoryPolicy = Omit<VariantInventoryPolicy, "colourCode">;

const STABLE_SKU_PATTERN = /^OCDLY-(TEE|SHIRT)-[A-Z0-9-]+-(XS|S|M|L|XL)$/;

const stocked = (): InventoryPolicy => ({
	outOfStockThreshold: 0,
	preorderEnabled: false,
	preorderLimit: 0,
});

const preorder = (
	preorderLimit: number,
	preorderLeadTimeDays: number,
	preorderDispatchWindow: string
): InventoryPolicy => ({
	outOfStockThreshold: -preorderLimit,
	preorderDispatchWindow,
	preorderEnabled: true,
	preorderLeadTimeDays,
	preorderLimit,
});

const variants = (
	skuPrefix: string,
	colourCode: string,
	policy: InventoryPolicy
): Readonly<Record<string, VariantInventoryPolicy>> =>
	Object.fromEntries(
		APPAREL_SIZES.map((size) => [
			`${skuPrefix}-${size}`,
			{ colourCode, ...policy },
		])
	);

export const catalogueProductProfiles = [
	{
		customFields: {
			care: "Machine wash cold with similar colours. Do not bleach. Dry in shade. Cool iron inside out.",
			collection: "The First Edit",
			composition: "100% compact cotton",
			countryOfOrigin: "India",
			dispatchWindow: "Ships within 2 business days",
			fabric: "Compact single jersey",
			fit: "Regular fit",
			gsm: 240,
			hsnCode: "61091000",
			modelMeasurements: "Model is 188 cm, chest 96 cm, and wears size M.",
			sizeChart:
				'[{"size":"XS","chestCm":91},{"size":"S","chestCm":96},{"size":"M","chestCm":101},{"size":"L","chestCm":106},{"size":"XL","chestCm":111}]',
		},
		slug: "essential-heavyweight-tee",
		variants: variants("OCDLY-TEE-ECRU", "ECRU", stocked()),
	},
	{
		customFields: {
			care: "Machine wash cold inside out. Do not iron the print. Do not bleach. Dry in shade.",
			collection: "The First Edit",
			composition: "100% combed cotton",
			countryOfOrigin: "India",
			dispatchWindow: "In-stock units ship within 2 business days",
			fabric: "Garment-dyed single jersey",
			fit: "Relaxed fit",
			gsm: 220,
			hsnCode: "61091000",
			modelMeasurements: "Model is 183 cm, chest 94 cm, and wears size M.",
			sizeChart:
				'[{"size":"XS","chestCm":96},{"size":"S","chestCm":101},{"size":"M","chestCm":106},{"size":"L","chestCm":111},{"size":"XL","chestCm":116}]',
		},
		slug: "one-more-scroll-tee",
		variants: variants(
			"OCDLY-TEE-SCROLL-WBK",
			"WASHED_BLACK",
			preorder(10, 21, "Preorders dispatch within 21 days")
		),
	},
	{
		customFields: {
			care: "Gentle machine wash cold. Do not bleach. Dry in shade. Warm iron while damp.",
			collection: "The First Edit",
			composition: "55% linen, 45% cotton",
			countryOfOrigin: "India",
			dispatchWindow: "Ships within 2 business days",
			fabric: "Linen-cotton plain weave",
			fit: "Relaxed fit",
			gsm: 145,
			hsnCode: "62059090",
			modelMeasurements: "Model is 185 cm, chest 97 cm, and wears size M.",
			sizeChart:
				'[{"size":"XS","chestCm":99},{"size":"S","chestCm":104},{"size":"M","chestCm":109},{"size":"L","chestCm":114},{"size":"XL","chestCm":119}]',
		},
		slug: "linen-ease-shirt",
		variants: variants("OCDLY-SHIRT-LINEN-NAT", "NATURAL", stocked()),
	},
] as const satisfies readonly CatalogueProductProfile[];

function isValidInventoryPolicy(policy: VariantInventoryPolicy): boolean {
	if (policy.preorderEnabled) {
		return (
			policy.preorderLimit > 0 &&
			policy.outOfStockThreshold === -policy.preorderLimit &&
			Boolean(policy.preorderLeadTimeDays) &&
			Boolean(policy.preorderDispatchWindow)
		);
	}

	return (
		policy.preorderLimit === 0 &&
		policy.outOfStockThreshold === 0 &&
		policy.preorderLeadTimeDays === undefined &&
		policy.preorderDispatchWindow === undefined
	);
}

export function validateCatalogueProductProfiles(
	profiles: readonly CatalogueProductProfile[]
): string[] {
	const errors: string[] = [];
	const slugs = new Set<string>();
	const skus = new Set<string>();

	for (const profile of profiles) {
		if (slugs.has(profile.slug)) {
			errors.push(`Duplicate product slug: ${profile.slug}`);
		}
		slugs.add(profile.slug);

		for (const [sku, policy] of Object.entries(profile.variants)) {
			if (skus.has(sku)) {
				errors.push(`Duplicate variant SKU: ${sku}`);
			}
			skus.add(sku);

			if (!STABLE_SKU_PATTERN.test(sku)) {
				errors.push(`Invalid stable SKU format: ${sku}`);
			}

			if (!isValidInventoryPolicy(policy)) {
				const policyType = policy.preorderEnabled ? "preorder" : "stocked-only";
				errors.push(`Invalid ${policyType} policy: ${sku}`);
			}
		}
	}

	return errors;
}
