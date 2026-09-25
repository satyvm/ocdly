import { type Category, filterProducts, type Product } from "./catalog";

const collectionDefinitions = [
	{
		category: "All",
		image: "/images/ocdly-hero.png",
		name: "New In",
		slug: "new-in",
		title: "Men's plain and printed T-shirts, made for right now.",
	},
	{
		category: "T-shirts",
		image: "/images/plain-tee-off-white.png",
		name: "T-shirts",
		slug: "t-shirts",
		title: "Plain foundations and original prints.",
	},
	{
		category: "Shirts",
		image: "/images/linen-shirt.jpg",
		name: "Shirts",
		slug: "shirts",
		title: "Relaxed shirts, beginning with linen.",
	},
] satisfies {
	slug: string;
	category: Category;
	name: string;
	title: string;
	image: string;
}[];

export const collections = collectionDefinitions;

export function findCollection(slug: string) {
	return collections.find((item) => item.slug === slug);
}

export function collectionSlug(category: Category) {
	return (
		collections.find((item) => item.category === category)?.slug ?? "new-in"
	);
}

export type SortOrder = "featured" | "price-low" | "price-high";
export function validateProductSearch(search: Record<string, unknown>): {
	q: string;
	sort: SortOrder;
} {
	return {
		q: typeof search.q === "string" ? search.q.slice(0, 200) : "",
		sort:
			search.sort === "price-low" || search.sort === "price-high"
				? search.sort
				: "featured",
	};
}
export function listingProducts(
	products: readonly Product[],
	category: Category,
	q: string,
	sort: SortOrder
) {
	return filterProducts(products, category, q).sort((a, b) => {
		if (sort === "price-low") {
			return a.price - b.price;
		}
		if (sort === "price-high") {
			return b.price - a.price;
		}
		return 0;
	});
}

export const informationPages = [
	{
		image: "/images/ocdly-hero.png",
		sections: [
			{
				text: "ocdly begins with the most familiar piece in a man's wardrobe: the T-shirt. We are building a distinct everyday uniform from India, one considered release at a time.",
				title: "A focused beginning",
			},
			{
				text: "Plain essentials create the foundation. Original printed tees turn relatable moments, internet culture and shared humour into designs that feel personal without chasing noise.",
				title: "Plain first. Prints with a point of view.",
			},
		],
		slug: "our-story",
		subtitle: "Made for everyday life.",
		title: "Our story",
	},
	{
		sections: [
			{
				text: "ocdly is starting online. There are no physical stores or stockists to visit yet.",
				title: "Online first",
			},
			{
				text: "Launch timing, availability and delivery details will appear here once the first collection is ready.",
				title: "Before launch",
			},
		],
		slug: "our-stores",
		subtitle: "The first collection is still taking shape.",
		title: "Our stores",
	},
	{
		image: "/images/printed-tee-one-more-scroll.png",
		sections: [
			{
				text: "After T-shirts, the wardrobe will expand carefully into polos, linen shirts, jeans, trousers and sweatpants.",
				title: "Building the wardrobe",
			},
			{
				text: "Indian and Japanese-inspired shirts and trousers will follow, then shoes. Each category will arrive only when it earns its place.",
				title: "What follows",
			},
		],
		slug: "roadmap",
		subtitle: "A deliberate path forward.",
		title: "What comes next",
	},
	{
		sections: [
			{
				text: "Browse a collection, choose a piece and select a size to add it to your cart. Your cart and wishlist are saved on this browser. Checkout is not connected, and no customer-service messages are collected here.",
				title: "Exploring this demo",
			},
			{
				text: "For assistance with an actual purchase, check back here as the launch takes shape. This preview does not create accounts, accept payments or place orders.",
				title: "Real orders and product enquiries",
			},
		],
		slug: "contact",
		subtitle: "How can we help?",
		title: "Contact us",
	},
	{
		sections: [
			{
				text: "No orders or deliveries are processed by this demonstration. Shipping costs and delivery estimates are not calculated, and we do not collect delivery addresses.",
				title: "Delivery",
			},
			{
				text: "There are no purchases to return from this preview. A complete returns policy will be published before orders open.",
				title: "Returns and exchanges",
			},
			{
				text: "Catalog prices and descriptions are illustrative. They are not current official offers or a guarantee of availability.",
				title: "Sample prices",
			},
		],
		slug: "delivery-returns",
		subtitle: "A note before you shop.",
		title: "Delivery & returns",
	},
	{
		sections: [
			{
				text: "Always follow the care label on your garment. These are general suggestions, not product-specific washing instructions.",
				title: "Start with the label",
			},
			{
				text: "Avoid unnecessary washing. Where the care label permits, use a gentle cycle and mild detergent. Separate colors and avoid overfilling the machine.",
				title: "Wash thoughtfully",
			},
			{
				text: "Dry in the shade when appropriate for the fabric. Let pieces dry completely before storing them, and fold knits rather than hanging them to help preserve their shape.",
				title: "Dry and store with care",
			},
			{
				text: "Product-specific care details will accompany every item when the collection launches.",
				title: "Product details",
			},
		],
		slug: "care-guide",
		subtitle: "Keep the pieces you love, longer.",
		title: "Care guide",
	},
	{
		sections: [
			{
				text: "The storefront uses local storage for your cart (ocdly.bag.v2), wishlist (ocdly.wishlist.v1), and cookie-notice preference (ocdly.cookie-choice). These values are not a customer account and do not synchronize across devices.",
				title: "On this browser",
			},
			{
				text: "Newsletter entries are validated in the browser but are not saved or sent. Checkout is informational: no addresses, payment details, or orders are collected through it.",
				title: "Forms and purchases",
			},
			{
				text: "Remove items from the cart and wishlist or clear this site’s browser storage to reset saved choices. The cookie-notice preference only controls the notice; there are no optional advertising cookies enabled by the storefront.",
				title: "Clearing your choices",
			},
			{
				text: "The development server may log page requests for diagnostics. This notice describes the storefront demo, not the separate scaffold authentication system.",
				title: "External destinations",
			},
		],
		slug: "privacy",
		subtitle: "What this demo remembers.",
		title: "Privacy policy",
	},
];
export function findInformation(slug: string) {
	return informationPages.find((item) => item.slug === slug);
}
