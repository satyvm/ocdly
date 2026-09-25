import { createFileRoute } from "@tanstack/react-router";
import { BagPage } from "@/components/storefront/bag-page";
export const Route = createFileRoute("/_store/bag")({
	head: () => ({ meta: [{ title: "Your cart — ocdly" }] }),
	component: BagPage,
});
