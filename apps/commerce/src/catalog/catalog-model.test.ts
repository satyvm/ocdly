import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
	APPAREL_SIZES,
	type CatalogueProductProfile,
	catalogueProductProfiles,
	validateCatalogueProductProfiles,
} from "./catalog-model";

const HSN_CODE_PATTERN = /^\d{8}$/;

test("seed catalogue has complete, unique and stable product metadata", () => {
	assert.deepEqual(
		validateCatalogueProductProfiles(catalogueProductProfiles),
		[]
	);
	assert.equal(catalogueProductProfiles.length, 3);

	const profiles =
		catalogueProductProfiles as readonly CatalogueProductProfile[];
	for (const profile of profiles) {
		assert.equal(Object.keys(profile.variants).length, APPAREL_SIZES.length);
		assert.ok(profile.customFields.fabric);
		assert.ok(profile.customFields.composition);
		assert.ok(profile.customFields.gsm > 0);
		assert.match(profile.customFields.hsnCode, HSN_CODE_PATTERN);
		assert.equal(profile.customFields.countryOfOrigin, "India");
		assert.doesNotThrow(() => JSON.parse(profile.customFields.sizeChart));
	}
});

test("every modeled SKU exists in the import CSV", async () => {
	const csvPath = path.join(
		process.cwd(),
		path.basename(process.cwd()) === "commerce"
			? "seed/products.csv"
			: "apps/commerce/seed/products.csv"
	);
	const csv = await readFile(csvPath, "utf8");
	const modeledSkus = catalogueProductProfiles.flatMap((profile) =>
		Object.keys(profile.variants)
	);

	for (const sku of modeledSkus) {
		assert.match(csv, new RegExp(`(^|,)${sku},`, "m"));
	}
});

test("preorder capacity is capped by Vendure's negative stock threshold", () => {
	const scrollTee = catalogueProductProfiles.find(
		(profile) => profile.slug === "one-more-scroll-tee"
	);
	assert.ok(scrollTee);

	for (const policy of Object.values(scrollTee.variants)) {
		assert.equal(policy.preorderEnabled, true);
		assert.equal(policy.preorderLimit, 10);
		assert.equal(policy.outOfStockThreshold, -10);
		assert.equal(policy.preorderLeadTimeDays, 21);
		assert.ok(policy.preorderDispatchWindow);
	}
});

test("validator rejects an uncapped preorder policy", () => {
	const invalidProfiles: CatalogueProductProfile[] = [
		{
			...catalogueProductProfiles[0],
			variants: {
				"OCDLY-TEE-BROKEN-M": {
					colourCode: "BLACK",
					outOfStockThreshold: 0,
					preorderEnabled: true,
					preorderLimit: 10,
				},
			},
		},
	];

	assert.deepEqual(validateCatalogueProductProfiles(invalidProfiles), [
		"Invalid preorder policy: OCDLY-TEE-BROKEN-M",
	]);
});
