import { createFileRoute } from "@tanstack/react-router";
import {
	StoreError,
	StoreLoading,
	StoreNotFound,
} from "@/components/storefront/page-parts";
import { StoreLayout } from "@/components/storefront/store-layout";
import { getStoreCatalog } from "@/functions/catalog";

export const Route = createFileRoute("/_store")({
	loader: () => getStoreCatalog(),
	component: StoreRoute,
	pendingComponent: StoreLoading,
	notFoundComponent: StoreNotFound,
	errorComponent: StoreError,
});

function StoreRoute() {
	const products = Route.useLoaderData();
	return <StoreLayout products={products} />;
}
