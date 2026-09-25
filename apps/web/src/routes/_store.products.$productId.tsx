import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductPage } from "@/components/storefront/product-page";
import { getStoreProduct } from "@/functions/catalog";
export const Route = createFileRoute("/_store/products/$productId")({
	loader: async ({ params }) => {
		const product = await getStoreProduct({ data: params.productId });
		if (!product) {
			throw notFound();
		}
		return product;
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `${loaderData?.name ?? "Product"} — ocdly` }],
	}),
	component: ProductRoute,
});
function ProductRoute() {
	const product = Route.useLoaderData();
	return <ProductPage key={product.id} product={product} />;
}
