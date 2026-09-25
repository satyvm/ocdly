import {
	assertProductData,
	assertProductsData,
	mapVendureProduct,
	mapVendureProducts,
	VendureCatalogError,
} from "./vendure-catalog";

export const PRODUCTS_QUERY = `
  query StorefrontProducts($options: ProductListOptions) {
    products(options: $options) {
      totalItems
      items {
        id
        name
        slug
        description
        featuredAsset { preview }
        assets { preview }
        facetValues { code name facet { code } }
        variants {
          id
          name
          sku
          currencyCode
          priceWithTax
          featuredAsset { preview }
          options { code name group { code name } }
        }
      }
    }
  }
`;

export const PRODUCT_QUERY = `
  query StorefrontProduct($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset { preview }
      assets { preview }
      facetValues { code name facet { code } }
      variants {
        id
        name
        sku
        currencyCode
        priceWithTax
        featuredAsset { preview }
        options { code name group { code name } }
      }
    }
  }
`;

interface GraphQlResponse {
	data?: unknown;
	errors?: Array<{ message?: string }>;
}

type VendureFetcher = (
	input: RequestInfo | URL,
	init?: RequestInit
) => Promise<Response>;

interface VendureClientConfig {
	channelToken?: string;
	endpoint: string;
	fetcher?: VendureFetcher;
}

function endpointFromEnvironment() {
	return process.env.VENDURE_SHOP_API_URL ?? "http://127.0.0.1:3050/shop-api";
}

function assetBaseUrl(endpoint: string) {
	try {
		return new URL(endpoint).origin;
	} catch (cause) {
		throw VendureCatalogError.from(
			"configuration",
			"VENDURE_SHOP_API_URL must be a valid absolute URL",
			cause
		);
	}
}

export function createVendureCatalogClient({
	channelToken,
	endpoint,
	fetcher = fetch,
}: VendureClientConfig) {
	const assets = assetBaseUrl(endpoint);

	async function execute(query: string, variables: Record<string, unknown>) {
		let response: Response;
		try {
			response = await fetcher(endpoint, {
				body: JSON.stringify({ query, variables }),
				headers: {
					"content-type": "application/json",
					...(channelToken ? { "vendure-token": channelToken } : {}),
				},
				method: "POST",
			});
		} catch (cause) {
			throw VendureCatalogError.from(
				"network",
				`Could not reach the Vendure Shop API at ${endpoint}`,
				cause
			);
		}
		if (!response.ok) {
			throw new VendureCatalogError(
				"network",
				`Vendure Shop API responded with HTTP ${response.status}`
			);
		}
		let payload: GraphQlResponse;
		try {
			payload = (await response.json()) as GraphQlResponse;
		} catch (cause) {
			throw VendureCatalogError.from(
				"response",
				"Vendure Shop API returned invalid JSON",
				cause
			);
		}
		if (payload.errors?.length) {
			const detail = payload.errors
				.map((error) => error.message)
				.filter(Boolean)
				.join("; ");
			throw new VendureCatalogError(
				"response",
				`Vendure catalogue query failed${detail ? `: ${detail}` : ""}`
			);
		}
		return payload.data;
	}

	return {
		async listProducts() {
			const data = assertProductsData(
				await execute(PRODUCTS_QUERY, { options: { take: 100 } })
			);
			return mapVendureProducts(data.products.items, assets);
		},
		async productBySlug(slug: string) {
			const data = assertProductData(await execute(PRODUCT_QUERY, { slug }));
			return data.product ? mapVendureProduct(data.product, assets) : null;
		},
	};
}

export function vendureCatalogClientFromEnvironment() {
	return createVendureCatalogClient({
		channelToken: process.env.VENDURE_CHANNEL_TOKEN,
		endpoint: endpointFromEnvironment(),
	});
}
