// biome-ignore-all lint/correctness/noGlobalDirnameFilename: Vendure compiles this service as CommonJS.
import path from "node:path";
import { GlobalFlag } from "@vendure/common/lib/generated-types";
import {
	bootstrap,
	ChannelService,
	CollectionService,
	CurrencyCode,
	ProductService,
	ProductVariantService,
	RequestContext,
	RequestContextService,
} from "@vendure/core";
import {
	importProductsFromCsv,
	populateCollections,
	populateInitialData,
} from "@vendure/core/cli";
import { Client } from "pg";
import {
	catalogueProductProfiles,
	validateCatalogueProductProfiles,
} from "./catalog/catalog-model";
import { environment } from "./environment";
import { initialData } from "./seed/initial-data";
import { config } from "./vendure-config";

async function isEmptyCommerceDatabase(): Promise<boolean> {
	const client = new Client({
		database: environment.database.name,
		host: environment.database.host,
		password: environment.database.password,
		port: environment.database.port,
		ssl: environment.database.ssl ? { rejectUnauthorized: true } : false,
		user: environment.database.username,
	});
	await client.connect();
	try {
		const result = await client.query<{ hasTables: boolean }>(
			"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE') AS \"hasTables\"",
			[environment.database.schema]
		);
		return result.rows[0]?.hasTables === false;
	} finally {
		await client.end();
	}
}

async function applyCatalogueModel(
	ctx: RequestContext,
	productService: ProductService,
	productVariantService: ProductVariantService
): Promise<void> {
	const validationErrors = validateCatalogueProductProfiles(
		catalogueProductProfiles
	);
	if (validationErrors.length > 0) {
		throw new Error(`Invalid catalogue model:\n${validationErrors.join("\n")}`);
	}

	const products = await productService.findAll(ctx, { take: 100 });
	const productBySlug = new Map(
		products.items.map((product) => [String(product.slug), product])
	);
	const variants = await productVariantService.findAll(ctx, { take: 500 });
	const variantBySku = new Map(
		variants.items.map((variant) => [variant.sku, variant])
	);

	await Promise.all(
		catalogueProductProfiles.map(async (profile) => {
			const product = productBySlug.get(profile.slug);
			if (!product) {
				throw new Error(`Catalogue product is missing: ${profile.slug}`);
			}

			await productService.update(ctx, {
				customFields: profile.customFields,
				id: product.id,
			});

			const variantUpdates = Object.entries(profile.variants).map(
				([sku, policy]) => {
					const variant = variantBySku.get(sku);
					if (!variant) {
						throw new Error(`Catalogue variant is missing: ${sku}`);
					}

					return {
						customFields: {
							colourCode: policy.colourCode,
							preorderDispatchWindow: policy.preorderDispatchWindow ?? null,
							preorderEnabled: policy.preorderEnabled,
							preorderLeadTimeDays: policy.preorderLeadTimeDays ?? null,
							preorderLimit: policy.preorderLimit,
						},
						id: variant.id,
						outOfStockThreshold: policy.outOfStockThreshold,
						trackInventory: GlobalFlag.TRUE,
						useGlobalOutOfStockThreshold: false,
					};
				}
			);

			await productVariantService.update(ctx, variantUpdates);
		})
	);
}

async function seed(): Promise<void> {
	const initializeSchema = await isEmptyCommerceDatabase();
	const app = await bootstrap({
		...config,
		dbConnectionOptions: {
			...config.dbConnectionOptions,
			migrations: [],
			synchronize: initializeSchema,
		},
	});
	const collectionService = app.get(CollectionService);
	collectionService.setApplyAllFiltersOnProductUpdates(false);

	try {
		const requestContextService = app.get(RequestContextService);
		const productService = app.get(ProductService);
		const productVariantService = app.get(ProductVariantService);
		const initialContext = await requestContextService.create({
			apiType: "admin",
		});
		const existingProducts = await productService.findAll(initialContext, {
			take: 1,
		});

		if (existingProducts.totalItems > 0) {
			await applyCatalogueModel(
				initialContext,
				productService,
				productVariantService
			);
			await collectionService.triggerApplyFiltersJob(initialContext);
			console.log("Catalogue model refreshed; product import skipped.");
			return;
		}

		await populateInitialData(app, initialData);

		const channelService = app.get(ChannelService);
		const channel = await channelService.getDefaultChannel();
		await channelService.update(RequestContext.empty(), {
			availableCurrencyCodes: [CurrencyCode.INR],
			defaultCurrencyCode: CurrencyCode.INR,
			id: channel.id,
			pricesIncludeTax: true,
		});
		const inrChannel = await channelService.getDefaultChannel();

		const productsPath = path.join(__dirname, "../seed/products.csv");
		const result = await importProductsFromCsv(
			app,
			productsPath,
			initialData.defaultLanguage,
			inrChannel
		);
		const errors = result.errors ?? [];
		if (errors.length > 0) {
			throw new Error(`Catalogue import failed:\n${errors.join("\n")}`);
		}

		await populateCollections(app, initialData, inrChannel);
		const catalogueContext = await requestContextService.create({
			apiType: "admin",
		});
		await applyCatalogueModel(
			catalogueContext,
			productService,
			productVariantService
		);
		await collectionService.triggerApplyFiltersJob(catalogueContext);
		console.log(`Seeded ${result.imported} products in INR.`);
	} finally {
		// Vendure event subscribers enqueue jobs asynchronously after product updates.
		// Let their debounced writes finish before closing the database connection.
		await new Promise((resolve) => setTimeout(resolve, 1000));
		await app.close();
	}
}

seed().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
