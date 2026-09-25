import type { Product } from "./catalog";

const clothingSizes = ["XS", "S", "M", "L", "XL"];

export const previewProducts: Product[] = [
	{
		alternate: "/images/ocdly-hero.png",
		category: "T-shirts",
		color: "Off white",
		currencyCode: "INR",
		description:
			"A heavyweight plain crew-neck T-shirt with a relaxed shape, dropped shoulders and a clean finish.",
		id: "essential-heavyweight-tee",
		image: "/images/plain-tee-off-white.png",
		name: "Essential Heavyweight Tee",
		price: 149_900,
		sizes: clothingSizes,
		swatch: "#e7e5db",
		vendureId: "preview-essential-heavyweight-tee",
	},
	{
		alternate: "/images/ocdly-hero.png",
		category: "T-shirts",
		color: "Washed black",
		currencyCode: "INR",
		description:
			"A relaxed heavyweight T-shirt with an original late-night scrolling illustration.",
		id: "one-more-scroll-tee",
		image: "/images/printed-tee-one-more-scroll.png",
		name: "One More Scroll Tee",
		price: 179_900,
		sizes: clothingSizes,
		swatch: "#292827",
		vendureId: "preview-one-more-scroll-tee",
	},
	{
		alternate: "/images/linen-shirt-back.jpg",
		category: "Shirts",
		color: "Natural linen",
		currencyCode: "INR",
		description:
			"A breathable linen shirt with an easy, slightly oversized shape.",
		id: "linen-ease-shirt",
		image: "/images/linen-shirt.jpg",
		name: "Linen Ease Shirt",
		price: 249_900,
		sizes: clothingSizes,
		swatch: "#d7cfbd",
		vendureId: "preview-linen-ease-shirt",
	},
];

export function previewProductBySlug(slug: string) {
	return previewProducts.find((product) => product.id === slug) ?? null;
}
