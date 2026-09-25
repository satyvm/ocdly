export type Category = "All" | "T-shirts" | "Shirts";

export interface Product {
	alternate: string;
	category: Exclude<Category, "All">;
	color: string;
	currencyCode: string;
	description: string;
	id: string;
	image: string;
	name: string;
	originalPrice?: number;
	price: number;
	sizes: string[];
	swatch: string;
	vendureId: string;
}

export const formatPrice = (price: number, currencyCode = "INR") =>
	new Intl.NumberFormat("en-IN", {
		currency: currencyCode,
		style: "currency",
	}).format(price / 100);

export function filterProducts(
	products: readonly Product[],
	category: Category,
	query = ""
) {
	const normalized = query.trim().toLocaleLowerCase();
	return products.filter((product) => {
		const matchesCategory = category === "All" || product.category === category;
		return (
			matchesCategory &&
			`${product.name} ${product.category} ${product.color}`
				.toLocaleLowerCase()
				.includes(normalized)
		);
	});
}
