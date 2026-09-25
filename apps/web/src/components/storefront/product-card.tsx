// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart } from "lucide-react";
import { formatPrice, type Product } from "@/lib/catalog";
export function ProductCard({
	product,
	saved,
	onSave,
}: {
	product: Product;
	saved: boolean;
	onSave: (id: string) => void;
	onOpen?: (product: Product) => void;
}) {
	return (
		<article className="product-card">
			<div className="product-photo">
				<Link
					aria-label={`View ${product.name}`}
					params={{ productId: product.id }}
					to="/products/$productId"
				>
					<img
						alt={`${product.name} in ${product.color}`}
						height="950"
						loading="lazy"
						src={product.image}
						width="710"
					/>
					<img
						alt=""
						className="product-alternate"
						height="950"
						loading="lazy"
						src={product.alternate}
						width="710"
					/>
					<span className="quick-view">
						Discover <ArrowUpRight size={15} />
					</span>
				</Link>
				<button
					aria-label={`${saved ? "Remove" : "Save"} ${product.name}${saved ? " from" : " to"} wishlist`}
					aria-pressed={saved}
					className="save-button icon-button"
					onClick={() => {
						onSave(product.id);
					}}
					type="button"
				>
					<Heart fill={saved ? "currentColor" : "none"} size={19} />
				</button>
				{product.originalPrice !== undefined && (
					<span className="product-badge">Bazar</span>
				)}
			</div>
			<div className="product-caption">
				<div>
					<Link params={{ productId: product.id }} to="/products/$productId">
						{product.name}
					</Link>
					<p className="product-price">
						{product.originalPrice !== undefined && (
							<del>
								{formatPrice(product.originalPrice, product.currencyCode)}
							</del>
						)}
						{formatPrice(product.price, product.currencyCode)}
					</p>
				</div>
				<span
					className="color-swatch"
					style={{ backgroundColor: product.swatch }}
					title={product.color}
				/>
			</div>
		</article>
	);
}
