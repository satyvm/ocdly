import { describe, expect, test } from "bun:test";

import {
	mapVendureProduct,
	VendureCatalogError,
	type VendureProduct,
} from "./vendure-catalog";
import { createVendureCatalogClient } from "./vendure-catalog.server";

const vendureProduct: VendureProduct = {
	assets: [
		{ preview: "/assets/tee-front.jpg" },
		{ preview: "/assets/tee-back.jpg" },
	],
	description: "Heavyweight cotton tee",
	facetValues: [
		{ code: "t-shirts", facet: { code: "category" }, name: "T-shirts" },
	],
	featuredAsset: { preview: "/assets/tee-front.jpg" },
	id: "1",
	name: "Everyday Plain Tee",
	slug: "everyday-plain-tee",
	variants: [
		{
			currencyCode: "INR",
			featuredAsset: null,
			id: "11",
			name: "Everyday Plain Tee S",
			options: [
				{ code: "s", group: { code: "size", name: "Size" }, name: "S" },
				{
					code: "off-white",
					group: { code: "color", name: "Color" },
					name: "Off white",
				},
			],
			priceWithTax: 149_900,
			sku: "TEE-OFF-S",
		},
		{
			currencyCode: "INR",
			featuredAsset: null,
			id: "12",
			name: "Everyday Plain Tee M",
			options: [
				{ code: "m", group: { code: "size", name: "Size" }, name: "M" },
			],
			priceWithTax: 149_900,
			sku: "TEE-OFF-M",
		},
	],
};

describe("Vendure catalogue mapping", () => {
	test("maps product assets, variants, prices, category, and sizes", () => {
		const product = mapVendureProduct(vendureProduct, "http://localhost:3050");

		expect(product.id).toBe("everyday-plain-tee");
		expect(product.vendureId).toBe("1");
		expect(product.category).toBe("T-shirts");
		expect(product.sizes).toEqual(["S", "M"]);
		expect(product.price).toBe(149_900);
		expect(product.currencyCode).toBe("INR");
		expect(product.image).toBe("http://localhost:3050/assets/tee-front.jpg");
		expect(product.alternate).toBe("http://localhost:3050/assets/tee-back.jpg");
	});

	test("rejects products without a priced variant", () => {
		expect(() =>
			mapVendureProduct({ ...vendureProduct, variants: [] }, "http://localhost")
		).toThrow(VendureCatalogError);
	});
});

describe("Vendure Shop API client", () => {
	test("sends a products query and optional channel token", async () => {
		let request: RequestInit | undefined;
		const fetcher = (_input: RequestInfo | URL, init?: RequestInit) => {
			request = init;
			return Promise.resolve(
				Response.json({
					data: { products: { items: [vendureProduct], totalItems: 1 } },
				})
			);
		};
		const client = createVendureCatalogClient({
			channelToken: "web",
			endpoint: "http://localhost:3050/shop-api",
			fetcher,
		});

		const products = await client.listProducts();
		const headers = new Headers(request?.headers);
		const body = JSON.parse(String(request?.body));

		expect(products).toHaveLength(1);
		expect(headers.get("vendure-token")).toBe("web");
		expect(body.query).toContain("products(options: $options)");
		expect(body.variables).toEqual({ options: { take: 100 } });
	});

	test("surfaces GraphQL failures without returning mock products", async () => {
		const client = createVendureCatalogClient({
			endpoint: "http://localhost:3050/shop-api",
			fetcher: async () =>
				Response.json({ errors: [{ message: "database unavailable" }] }),
		});

		await expect(client.listProducts()).rejects.toMatchObject({
			code: "response",
			message: "Vendure catalogue query failed: database unavailable",
		});
	});
});
