import { Link } from "@tanstack/react-router";
import { Check, Heart } from "lucide-react";
import { type MouseEvent, useCallback, useState } from "react";
import { addToBag, useBag } from "@/lib/bag";
import { formatPrice, type Product } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { collectionSlug } from "@/lib/store-pages";
import { toggleSaved, useWishlist } from "@/lib/wishlist";
import { Breadcrumb, ProductGrid } from "./page-parts";

export function ProductPage({ product }: { product: Product }) {
	const products = useCatalog();
	const [size, setSize] = useState("");
	const [error, setError] = useState("");
	const [added, setAdded] = useState(false);
	const [alternate, setAlternate] = useState(false);
	const saved = useWishlist();
	const bag = useBag();
	const quantity =
		bag.find((item) => item.id === product.id && item.size === size)
			?.quantity ?? 0;
	const isSaved = saved.includes(product.id);
	const related = products.filter(
		(item) => item.id !== product.id && item.category === product.category
	);
	const suggestions =
		related.length > 0
			? related
			: products.filter((item) => item.id !== product.id).slice(0, 3);
	const showFront = useCallback(() => setAlternate(false), []);
	const showAlternate = useCallback(() => setAlternate(true), []);
	const selectSize = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		setSize(event.currentTarget.value);
		setError("");
		setAdded(false);
	}, []);
	const save = useCallback(() => {
		toggleSaved(product.id);
	}, [product.id]);
	const add = useCallback(() => {
		if (!size) {
			setError("Please select a size before adding this piece to your cart.");
			return;
		}
		if (quantity >= 10) {
			setError("You already have the maximum of 10 in this size.");
			return;
		}
		addToBag(product, size);
		setError("");
		setAdded(true);
	}, [product, quantity, size]);
	return (
		<main className="store-page product-detail-page" id="main-content">
			<Breadcrumb name={product.name} />
			<div className="product-detail-layout">
				<div className="detail-gallery">
					<img
						alt={`${product.name} — ${alternate ? "alternate view" : "front view"}`}
						className="detail-photo"
						height={1400}
						src={alternate ? product.alternate : product.image}
						width={1100}
					/>
					<div className="gallery-controls">
						<button aria-pressed={!alternate} onClick={showFront} type="button">
							Front view
						</button>
						{product.alternate !== product.image && (
							<button
								aria-pressed={alternate}
								onClick={showAlternate}
								type="button"
							>
								Alternate view
							</button>
						)}
					</div>
				</div>
				<section aria-label="Product details" className="detail-copy">
					<Link
						className="detail-category"
						params={{ category: collectionSlug(product.category) }}
						search={{ q: "", sort: "featured" }}
						to="/collections/$category"
					>
						{product.category}
					</Link>
					<h1>{product.name}</h1>
					<p className="detail-price">
						{product.originalPrice !== undefined && (
							<del>
								{formatPrice(product.originalPrice, product.currencyCode)}
							</del>
						)}{" "}
						{formatPrice(product.price, product.currencyCode)}
					</p>
					<p className="detail-description">{product.description}</p>
					<p className="detail-color">
						<span
							className="color-swatch"
							style={{ backgroundColor: product.swatch }}
						/>
						{product.color}
					</p>
					<fieldset
						aria-describedby={error ? "size-error" : undefined}
						className="detail-sizes"
					>
						<legend>Select your size</legend>
						<div>
							{product.sizes.map((value) => (
								<button
									aria-pressed={size === value}
									key={value}
									onClick={selectSize}
									type="button"
									value={value}
								>
									{value}
								</button>
							))}
						</div>
					</fieldset>
					<p className="detail-note">
						Sample sizing only. Final measurements and fit notes will be
						published before launch.
					</p>
					{error !== "" && (
						<p className="form-error" id="size-error" role="alert">
							{error}
						</p>
					)}
					<div className="detail-actions">
						<button
							className="solid-button"
							disabled={quantity >= 10}
							onClick={add}
							type="button"
						>
							{quantity >= 10 ? "Maximum quantity reached" : "Add to cart"}
						</button>
						<button
							aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
							aria-pressed={isSaved}
							className="detail-save"
							onClick={save}
							type="button"
						>
							<Heart fill={isSaved ? "currentColor" : "none"} size={20} />
						</button>
					</div>
					{added ? (
						<div className="added-notice" role="status">
							<Check size={16} />
							Added to your cart. <Link to="/bag">View cart</Link>
						</div>
					) : null}
					<p className="detail-note">
						Collection preview. No purchase will be processed.
					</p>
					<div className="detail-disclosures">
						<details>
							<summary>Care and materials</summary>
							<p>
								Follow the care label on the actual garment. The sample
								description is not a verified materials specification.
							</p>
							<Link params={{ slug: "care-guide" }} to="/pages/$slug">
								Read the care guide
							</Link>
						</details>
						<details>
							<summary>Delivery and returns</summary>
							<p>No deliveries or returns are processed in this demo.</p>
							<Link params={{ slug: "delivery-returns" }} to="/pages/$slug">
								Delivery & returns information
							</Link>
						</details>
					</div>
				</section>
			</div>
			<section className="related-products">
				<h2>In good company.</h2>
				<ProductGrid items={suggestions.slice(0, 4)} />
			</section>
		</main>
	);
}
