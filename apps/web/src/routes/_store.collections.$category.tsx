// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ListingPage } from "@/components/storefront/listing-page";
import { findCollection, validateProductSearch } from "@/lib/store-pages";

export const Route = createFileRoute("/_store/collections/$category")({
	validateSearch: validateProductSearch,
	loader: ({ params }) => {
		const collection = findCollection(params.category);
		if (!collection) {
			throw notFound();
		}
		return collection;
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `${loaderData?.name ?? "Collection"} — ocdly` }],
	}),
	component: CollectionPage,
});
function CollectionPage() {
	const collection = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	return (
		<ListingPage
			category={collection.category}
			image={collection.image}
			subtitle={collection.title}
			title={collection.name}
			{...search}
			onSearch={(next) => {
				navigate({ search: next, replace: true, resetScroll: false });
			}}
		/>
	);
}
