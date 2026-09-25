import { createFileRoute } from "@tanstack/react-router";

import { Storefront } from "@/components/storefront/storefront";

export const Route = createFileRoute("/_store/")({
	component: Storefront,
});
