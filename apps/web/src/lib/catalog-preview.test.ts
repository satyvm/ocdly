import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";

import { previewProducts } from "./catalog-preview.server";

describe("preview catalogue fallback", () => {
	test("references storefront assets that exist", () => {
		for (const product of previewProducts) {
			for (const asset of [product.image, product.alternate]) {
				expect(asset).toStartWith("/images/");
				const publicAsset = path.join(
					import.meta.dir,
					"../../public",
					asset.slice(1)
				);
				expect(existsSync(publicAsset)).toBe(true);
			}
		}
	});
});
