// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, Search, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { removeFromBag, setQuantity, useBag } from "@/lib/bag";
import { filterProducts, formatPrice } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { toggleSaved, useWishlist } from "@/lib/wishlist";
import { Modal } from "./modal";

export type StorePanel = "shop" | "search" | "cart" | "wishlist" | null;

export function StoreOverlays({
	panel,
	onClose,
}: {
	panel: StorePanel;
	onClose: () => void;
}) {
	if (panel === "shop") {
		return <ShopPanel onClose={onClose} />;
	}
	if (panel === "search") {
		return <SearchPanel onClose={onClose} />;
	}
	if (panel === "cart") {
		return <CartPanel onClose={onClose} />;
	}
	if (panel === "wishlist") {
		return <WishlistPanel onClose={onClose} />;
	}
	return null;
}

function ShopPanel({ onClose }: { onClose: () => void }) {
	return (
		<Modal
			className="shop-menu-dialog"
			onClose={onClose}
			title="Explore ocdly"
			wide
		>
			<div className="shop-menu-grid">
				<section>
					<p className="panel-kicker">Discover</p>
					<nav className="shop-menu-links">
						<Link
							onClick={onClose}
							params={{ category: "new-in" }}
							search={{ q: "", sort: "featured" }}
							to="/collections/$category"
						>
							New In
						</Link>
						<Link
							onClick={onClose}
							params={{ slug: "our-story" }}
							to="/pages/$slug"
						>
							Our approach
						</Link>
						<Link onClick={onClose} to="/wishlist">
							Your saved pieces
						</Link>
					</nav>
					<strong className="shop-menu-mark">ocdly</strong>
				</section>
				<section>
					<p className="panel-kicker">The wardrobe</p>
					<nav className="shop-menu-links">
						<Link
							onClick={onClose}
							params={{ category: "new-in" }}
							search={{ q: "", sort: "featured" }}
							to="/collections/$category"
						>
							Shop everything
						</Link>
						<Link
							onClick={onClose}
							params={{ category: "t-shirts" }}
							search={{ q: "", sort: "featured" }}
							to="/collections/$category"
						>
							T-shirts
						</Link>
						<Link
							onClick={onClose}
							params={{ category: "shirts" }}
							search={{ q: "", sort: "featured" }}
							to="/collections/$category"
						>
							Shirts
						</Link>
					</nav>
				</section>
				<section className="shop-menu-idea">
					<p className="panel-kicker">The idea</p>
					<h3>
						Less noise.
						<br />
						More feeling.
					</h3>
					<p>We're taking our time with the things you'll spend yours in.</p>
				</section>
				<img
					alt="A considered ocdly wardrobe"
					className="shop-menu-image"
					height="600"
					src="/images/ocdly-editorial.jpg"
					width="900"
				/>
			</div>
		</Modal>
	);
}

function SearchPanel({ onClose }: { onClose: () => void }) {
	const products = useCatalog();
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();
	const matches = useMemo(
		() =>
			query.trim()
				? filterProducts(products, "All", query).slice(0, 4)
				: products.slice(0, 4),
		[products, query]
	);
	useEffect(() => {
		inputRef.current?.focus();
	}, []);
	function submitSearch(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const value = query.trim();
		if (!value) {
			return;
		}
		navigate({ search: { q: value, sort: "featured" }, to: "/search" });
		onClose();
	}
	return (
		<Modal
			className="search-dialog"
			onClose={onClose}
			title="Search ocdly"
			wide
		>
			<div className="search-panel-body">
				<form className="search-panel-form" onSubmit={submitSearch}>
					<Search aria-hidden="true" size={24} />
					<label className="sr-only" htmlFor="overlay-search">
						Search products
					</label>
					<input
						id="overlay-search"
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Type your search"
						ref={inputRef}
						type="search"
						value={query}
					/>
					<span>Press Enter</span>
				</form>
				<div className="search-panel-content">
					<div>
						<p className="panel-kicker">Popular searches</p>
						<div className="search-suggestions">
							<button onClick={() => setQuery("T-shirt")} type="button">
								T-shirts
							</button>
							<button onClick={() => setQuery("shirt")} type="button">
								Shirts
							</button>
							<button onClick={() => setQuery("printed")} type="button">
								Printed
							</button>
						</div>
					</div>
					<div>
						<p className="panel-kicker">
							{query.trim()
								? `${matches.length} suggested pieces`
								: "Suggested pieces"}
						</p>
						<div className="search-result-grid">
							{matches.map((product) => (
								<Link
									key={product.id}
									onClick={onClose}
									params={{ productId: product.id }}
									to="/products/$productId"
								>
									<img
										alt={product.name}
										height="640"
										src={product.image}
										width="520"
									/>
									<span>{product.name}</span>
									<small>
										{formatPrice(product.price, product.currencyCode)}
									</small>
								</Link>
							))}
							{matches.length === 0 ? (
								<p className="panel-empty">
									No pieces match yet. Press Enter to see the full search.
								</p>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
}

function CartPanel({ onClose }: { onClose: () => void }) {
	const bag = useBag();
	const count = bag.reduce((sum, item) => sum + item.quantity, 0);
	const total = bag.reduce((sum, item) => sum + item.price * item.quantity, 0);
	return (
		<Modal
			className="utility-drawer"
			onClose={onClose}
			title={`Cart (${count})`}
		>
			<div className="drawer-body">
				{bag.length === 0 ? (
					<div className="drawer-empty">
						<h3>Your cart is empty.</h3>
						<p>Pieces you add will stay here, ready when you are.</p>
						<Link
							onClick={onClose}
							params={{ category: "new-in" }}
							search={{ q: "", sort: "featured" }}
							to="/collections/$category"
						>
							Explore New In <ArrowRight size={16} />
						</Link>
					</div>
				) : (
					<>
						<div className="drawer-items">
							{bag.map((item) => (
								<article className="drawer-item" key={item.key}>
									<Link
										onClick={onClose}
										params={{ productId: item.id }}
										to="/products/$productId"
									>
										<img
											alt={item.name}
											height="640"
											src={item.image}
											width="520"
										/>
									</Link>
									<div>
										<Link
											onClick={onClose}
											params={{ productId: item.id }}
											to="/products/$productId"
										>
											{item.name}
										</Link>
										<p>
											{item.color} / Size {item.size}
										</p>
										<p>{formatPrice(item.price, item.currencyCode)}</p>
										<div className="drawer-item-actions">
											<button
												aria-label={`Decrease ${item.name} quantity`}
												onClick={() => setQuantity(item.key, item.quantity - 1)}
												type="button"
											>
												<Minus size={13} />
											</button>
											<span>{item.quantity}</span>
											<button
												aria-label={`Increase ${item.name} quantity`}
												disabled={item.quantity >= 10}
												onClick={() => setQuantity(item.key, item.quantity + 1)}
												type="button"
											>
												<Plus size={13} />
											</button>
											<button
												aria-label={`Remove ${item.name}`}
												onClick={() => removeFromBag(item.key)}
												type="button"
											>
												<Trash2 size={13} />
											</button>
										</div>
									</div>
								</article>
							))}
						</div>
						<div className="drawer-footer">
							<div>
								<span>Subtotal</span>
								<strong>{formatPrice(total)}</strong>
							</div>
							<p>Shipping and taxes calculated later.</p>
							<Link className="solid-button" onClick={onClose} to="/checkout">
								Checkout
							</Link>
							<Link className="drawer-text-link" onClick={onClose} to="/bag">
								View full cart
							</Link>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}

function WishlistPanel({ onClose }: { onClose: () => void }) {
	const products = useCatalog();
	const savedIds = useWishlist();
	const saved = products.filter((product) => savedIds.includes(product.id));
	return (
		<Modal
			className="utility-drawer"
			onClose={onClose}
			title={`Wishlist (${saved.length})`}
		>
			<div className="drawer-body">
				{saved.length === 0 ? (
					<div className="drawer-empty">
						<h3>Nothing saved yet.</h3>
						<p>Keep the pieces you want to come back to.</p>
						<Link
							onClick={onClose}
							params={{ category: "new-in" }}
							search={{ q: "", sort: "featured" }}
							to="/collections/$category"
						>
							Find something worth saving <ArrowRight size={16} />
						</Link>
					</div>
				) : (
					<>
						<div className="drawer-items">
							{saved.map((product) => (
								<article className="drawer-item" key={product.id}>
									<Link
										onClick={onClose}
										params={{ productId: product.id }}
										to="/products/$productId"
									>
										<img
											alt={product.name}
											height="640"
											src={product.image}
											width="520"
										/>
									</Link>
									<div>
										<Link
											onClick={onClose}
											params={{ productId: product.id }}
											to="/products/$productId"
										>
											{product.name}
										</Link>
										<p>{product.color}</p>
										<p>{formatPrice(product.price, product.currencyCode)}</p>
										<button
											className="drawer-remove"
											onClick={() => toggleSaved(product.id)}
											type="button"
										>
											Remove
										</button>
									</div>
								</article>
							))}
						</div>
						<div className="drawer-footer">
							<Link className="solid-button" onClick={onClose} to="/wishlist">
								View wishlist
							</Link>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}
