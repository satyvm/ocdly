// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { removeFromBag, setQuantity, useBag } from "@/lib/bag";
import { formatPrice } from "@/lib/catalog";
import { Breadcrumb, EmptyState, PageHeading } from "./page-parts";

export function BagPage({ checkout = false }: { checkout?: boolean }) {
	const bag = useBag();
	const count = bag.reduce((sum, item) => sum + item.quantity, 0);
	const total = bag.reduce((sum, item) => sum + item.price * item.quantity, 0);
	const title = checkout ? "Checkout information" : "Your cart";
	return (
		<main className="store-page" id="main-content">
			<Breadcrumb name={title} />
			<PageHeading
				subtitle={
					checkout
						? "A shopping experience, without the purchase."
						: `${count} ${count === 1 ? "piece" : "pieces"}. Saved on this browser.`
				}
				title={title}
			/>
			{checkout ? (
				<section className="checkout-banner">
					<h2>This is a demonstration storefront.</h2>
					<p>
						Checkout is not connected. No order will be created, and we do not
						collect payment details or delivery addresses. Your cart remains
						available to explore.
					</p>
				</section>
			) : null}
			{bag.length === 0 ? (
				<EmptyState title="Your cart is empty.">
					<p>Find a piece you love and select a size to get started.</p>
				</EmptyState>
			) : (
				<div className="bag-page-layout">
					<section aria-label="Cart items" className="bag-page-items">
						{bag.map((item) => (
							<article className="bag-page-item" key={item.key}>
								<Link params={{ productId: item.id }} to="/products/$productId">
									<img
										alt={item.name}
										height={1000}
										src={item.image}
										width={800}
									/>
								</Link>
								<div className="bag-item-copy">
									<Link
										params={{ productId: item.id }}
										to="/products/$productId"
									>
										<h2>{item.name}</h2>
									</Link>
									<p>
										{item.color} / Size {item.size}
									</p>
									<p>{formatPrice(item.price, item.currencyCode)} each</p>
									{checkout ? (
										<p>Quantity: {item.quantity}</p>
									) : (
										<>
											<div className="quantity-control">
												<button
													aria-label={`Decrease quantity of ${item.name}, size ${item.size}`}
													onClick={() =>
														setQuantity(item.key, item.quantity - 1)
													}
													type="button"
												>
													<Minus size={14} />
												</button>
												<span aria-live="polite">{item.quantity}</span>
												<button
													aria-label={`Increase quantity of ${item.name}, size ${item.size}`}
													disabled={item.quantity >= 10}
													onClick={() =>
														setQuantity(item.key, item.quantity + 1)
													}
													type="button"
												>
													<Plus size={14} />
												</button>
											</div>
											<button
												aria-label={`Remove ${item.name}, size ${item.size}`}
												className="text-button"
												onClick={() => removeFromBag(item.key)}
												type="button"
											>
												Remove
											</button>
										</>
									)}
								</div>
								<p className="bag-line-price">
									{formatPrice(item.price * item.quantity)}
								</p>
							</article>
						))}
					</section>
					<aside className="order-summary">
						<h2>Cart summary</h2>
						<dl>
							<div>
								<dt>Pieces</dt>
								<dd>{count}</dd>
							</div>
							<div>
								<dt>Subtotal</dt>
								<dd>{formatPrice(total)}</dd>
							</div>
							<div>
								<dt>Delivery</dt>
								<dd>Not available in demo</dd>
							</div>
						</dl>
						<p>Sample prices only. No amount is charged.</p>
						{checkout ? (
							<Link className="solid-button" to="/bag">
								Return to your cart
							</Link>
						) : (
							<Link className="solid-button" to="/checkout">
								Checkout information
							</Link>
						)}
						<Link
							className="text-button"
							params={{ category: "new-in" }}
							search={{ q: "", sort: "featured" }}
							to="/collections/$category"
						>
							Continue exploring
						</Link>
					</aside>
				</div>
			)}
		</main>
	);
}
