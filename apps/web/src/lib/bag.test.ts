import { describe, expect, test } from "bun:test";

import { parseBag } from "./bag";

const storedItem = {
	color: "Off white",
	currencyCode: "INR",
	id: "essential-heavyweight-tee",
	image: "/images/plain-tee-off-white.png",
	name: "Essential Heavyweight Tee",
	price: 149_900,
	quantity: 2,
	size: "M",
};

describe("bag persistence", () => {
	test("restores a stable product-and-size key", () => {
		expect(parseBag(JSON.stringify([storedItem]))).toEqual([
			{
				...storedItem,
				key: "essential-heavyweight-tee__M",
			},
		]);
	});

	test("keeps separate sizes and de-duplicates the same variant", () => {
		const result = parseBag(
			JSON.stringify([
				storedItem,
				{ ...storedItem, quantity: 3 },
				{ ...storedItem, quantity: 1, size: "L" },
			])
		);

		expect(result).toHaveLength(2);
		expect(result).toContainEqual({
			...storedItem,
			key: "essential-heavyweight-tee__M",
			quantity: 3,
		});
		expect(result).toContainEqual({
			...storedItem,
			key: "essential-heavyweight-tee__L",
			quantity: 1,
			size: "L",
		});
	});

	test("caps restored quantities and preserves integer minor-unit prices", () => {
		const [item] = parseBag(
			JSON.stringify([{ ...storedItem, price: 179_900, quantity: 99 }])
		);

		expect(item?.price).toBe(179_900);
		expect(item?.quantity).toBe(10);
	});

	test("drops malformed entries instead of breaking the cart", () => {
		const result = parseBag(
			JSON.stringify([
				storedItem,
				{ ...storedItem, id: null },
				{ ...storedItem, price: Number.NaN },
				{ ...storedItem, quantity: 0 },
			])
		);

		expect(result).toHaveLength(1);
		expect(parseBag("not-json")).toEqual([]);
		expect(parseBag(JSON.stringify({ item: storedItem }))).toEqual([]);
	});
});
