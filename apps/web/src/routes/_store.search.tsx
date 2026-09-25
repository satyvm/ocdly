// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { createFileRoute } from "@tanstack/react-router";
import { ListingPage } from "@/components/storefront/listing-page";
import { validateProductSearch } from "@/lib/store-pages";
export const Route = createFileRoute("/_store/search")({
	validateSearch: validateProductSearch,
	head: () => ({ meta: [{ title: "Search — ocdly" }] }),
	component: SearchPage,
});
function SearchPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	return (
		<ListingPage
			category="All"
			subtitle="Explore by name, color, or collection."
			title="Find your next piece."
			{...search}
			onSearch={(next) => {
				navigate({ search: next, replace: true, resetScroll: false });
			}}
		/>
	);
}
