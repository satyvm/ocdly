import assert from "node:assert/strict";
import test from "node:test";
import { fashionCustomFields } from "./custom-fields";

test("fashion custom fields expose the T2 product contract to the Shop API", () => {
	const fields = new Map(
		fashionCustomFields.Product?.map((field) => [field.name, field])
	);
	const requiredFields = [
		"fabric",
		"composition",
		"gsm",
		"fit",
		"care",
		"hsnCode",
		"countryOfOrigin",
		"sizeChart",
		"modelMeasurements",
		"collection",
		"dispatchWindow",
	];

	assert.deepEqual([...fields.keys()], requiredFields);
	for (const field of fields.values()) {
		assert.equal(field.public, true);
	}
});

test("variant custom fields expose colour and explicit preorder metadata", () => {
	const fields = new Map(
		fashionCustomFields.ProductVariant?.map((field) => [field.name, field])
	);

	assert.deepEqual(
		[...fields.keys()],
		[
			"colourCode",
			"preorderEnabled",
			"preorderLimit",
			"preorderLeadTimeDays",
			"preorderDispatchWindow",
		]
	);
	assert.equal(fields.get("preorderEnabled")?.defaultValue, false);
	assert.equal(fields.get("preorderLimit")?.defaultValue, 0);
	for (const field of fields.values()) {
		assert.equal(field.public, true);
	}
});
