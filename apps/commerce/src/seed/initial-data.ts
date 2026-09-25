import { type InitialData, LanguageCode } from "@vendure/core";

export const initialData: InitialData = {
	collections: [
		{
			description: "Premium plain and original printed T-shirts.",
			filters: [
				{
					args: { containsAny: false, facetValueNames: ["T-shirts"] },
					code: "facet-value-filter",
				},
			],
			name: "T-shirts",
			slug: "t-shirts",
		},
		{
			description: "Quiet essentials built around fabric, fit and finish.",
			filters: [
				{
					args: { containsAny: false, facetValueNames: ["Plain"] },
					code: "facet-value-filter",
				},
			],
			name: "Plain T-shirts",
			parentName: "T-shirts",
			slug: "plain-t-shirts",
		},
		{
			description: "Original prints rooted in familiar internet culture.",
			filters: [
				{
					args: { containsAny: false, facetValueNames: ["Printed"] },
					code: "facet-value-filter",
				},
			],
			name: "Printed T-shirts",
			parentName: "T-shirts",
			slug: "printed-t-shirts",
		},
		{
			description: "Relaxed shirts made for warm days and slower hours.",
			filters: [
				{
					args: { containsAny: false, facetValueNames: ["Shirts"] },
					code: "facet-value-filter",
				},
			],
			name: "Shirts",
			slug: "shirts",
		},
	],
	countries: [{ code: "IN", name: "India", zone: "India" }],
	defaultLanguage: LanguageCode.en,
	defaultZone: "India",
	paymentMethods: [
		{
			handler: {
				arguments: [{ name: "automaticSettle", value: "true" }],
				code: "dummy-payment-handler",
			},
			name: "Development payment",
		},
	],
	roles: [],
	shippingMethods: [{ name: "Standard delivery", price: 9900, taxRate: 0 }],
	taxRates: [{ name: "India apparel GST", percentage: 5 }],
};
