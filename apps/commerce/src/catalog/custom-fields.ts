import { type CustomFields, LanguageCode } from "@vendure/core";

const englishLabel = (value: string) => [
	{ languageCode: LanguageCode.en, value },
];

export const fashionCustomFields = {
	Product: [
		{
			label: englishLabel("Fabric"),
			name: "fabric",
			public: true,
			type: "string",
		},
		{
			label: englishLabel("Composition"),
			name: "composition",
			public: true,
			type: "string",
		},
		{
			label: englishLabel("Fabric weight (GSM)"),
			name: "gsm",
			public: true,
			type: "int",
			ui: { min: 1 },
		},
		{ label: englishLabel("Fit"), name: "fit", public: true, type: "string" },
		{
			label: englishLabel("Care"),
			name: "care",
			public: true,
			type: "text",
			ui: { component: "textarea-form-input" },
		},
		{
			label: englishLabel("HSN code"),
			name: "hsnCode",
			public: true,
			type: "string",
		},
		{
			label: englishLabel("Country of origin"),
			name: "countryOfOrigin",
			public: true,
			type: "string",
		},
		{
			label: englishLabel("Size chart"),
			name: "sizeChart",
			public: true,
			type: "text",
			ui: { component: "textarea-form-input" },
		},
		{
			label: englishLabel("Model measurements"),
			name: "modelMeasurements",
			public: true,
			type: "text",
			ui: { component: "textarea-form-input" },
		},
		{
			label: englishLabel("Collection"),
			name: "collection",
			public: true,
			type: "string",
		},
		{
			label: englishLabel("Dispatch window"),
			name: "dispatchWindow",
			public: true,
			type: "string",
		},
	],
	ProductVariant: [
		{
			label: englishLabel("Colour code"),
			name: "colourCode",
			public: true,
			type: "string",
		},
		{
			defaultValue: false,
			label: englishLabel("Preorder enabled"),
			name: "preorderEnabled",
			public: true,
			type: "boolean",
		},
		{
			defaultValue: 0,
			label: englishLabel("Preorder limit"),
			name: "preorderLimit",
			public: true,
			type: "int",
			ui: { min: 0 },
		},
		{
			label: englishLabel("Preorder lead time (days)"),
			name: "preorderLeadTimeDays",
			nullable: true,
			public: true,
			type: "int",
			ui: { min: 1 },
		},
		{
			label: englishLabel("Preorder dispatch window"),
			name: "preorderDispatchWindow",
			nullable: true,
			public: true,
			type: "string",
		},
	],
} satisfies CustomFields;
