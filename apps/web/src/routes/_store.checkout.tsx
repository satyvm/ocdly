import { createFileRoute } from "@tanstack/react-router";
import { BagPage } from "@/components/storefront/bag-page";
export const Route = createFileRoute("/_store/checkout")({
	head: () => ({
		meta: [{ title: "Checkout information — ocdly" }],
	}),
	component: CheckoutPage,
});
function CheckoutPage() {
	return <BagPage checkout />;
}
