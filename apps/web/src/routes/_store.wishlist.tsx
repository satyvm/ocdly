import { createFileRoute } from "@tanstack/react-router";
import {
	Breadcrumb,
	EmptyState,
	PageHeading,
	ProductGrid,
} from "@/components/storefront/page-parts";
import { useCatalog } from "@/lib/catalog-context";
import { useWishlist } from "@/lib/wishlist";
export const Route = createFileRoute("/_store/wishlist")({
	head: () => ({ meta: [{ title: "Wishlist — ocdly" }] }),
	component: WishlistPage,
});
function WishlistPage() {
	const products = useCatalog();
	const saved = useWishlist();
	const items = products.filter((product) => saved.includes(product.id));
	return (
		<main className="store-page" id="main-content">
			<Breadcrumb name="Wishlist" />
			<PageHeading
				subtitle="A few pieces to come back to. Saved on this browser."
				title="Your wishlist"
			/>
			{items.length > 0 ? (
				<>
					<p className="result-count" role="status">
						{items.length} saved pieces
					</p>
					<ProductGrid items={items} />
				</>
			) : (
				<EmptyState title="Keep what catches your eye.">
					<p>Tap the heart on a piece to save it here.</p>
				</EmptyState>
			)}
		</main>
	);
}
