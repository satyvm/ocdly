// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
	ArrowRight,
	Check,
	ChevronDown,
	Heart,
	Menu,
	MessageCircle,
	Search,
	ShoppingBag,
	UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useBag } from "@/lib/bag";
import type { Product } from "@/lib/catalog";
import { CatalogProvider } from "@/lib/catalog-context";
import { informationPages } from "@/lib/store-pages";
import { useWishlist } from "@/lib/wishlist";
import { StoreOverlays, type StorePanel } from "./store-overlays";

export function StoreLayout({ products }: { products: readonly Product[] }) {
	return (
		<CatalogProvider products={products}>
			<StoreLayoutContent />
		</CatalogProvider>
	);
}

function StoreLayoutContent() {
	const pathname = useLocation({ select: (location) => location.pathname });
	const home = pathname === "/";
	const [panel, setPanel] = useState<StorePanel>(null);
	const [cookies, setCookies] = useState(false);
	const [subscribed, setSubscribed] = useState(false);
	const bag = useBag();
	const saved = useWishlist();
	const count = bag.reduce((sum, item) => sum + item.quantity, 0);
	useEffect(() => {
		try {
			setCookies(!localStorage.getItem("ocdly.cookie-choice"));
		} catch {
			setCookies(true);
		}
	}, []);
	useEffect(() => {
		if (pathname) {
			setPanel(null);
		}
	}, [pathname]);
	function acceptCookies() {
		setCookies(false);
		try {
			localStorage.setItem("ocdly.cookie-choice", "essential");
		} catch {
			setCookies(false);
		}
	}
	return (
		<div
			className={`storefront ${home ? "home-store" : "inner-store"}`}
			id="top"
		>
			<a className="skip-link" href="#main-content">
				Skip to content
			</a>
			<header className="store-header">
				<nav aria-label="Main navigation" className="desktop-nav">
					<button
						className="shop-trigger"
						onClick={() => setPanel("shop")}
						type="button"
					>
						Shop <ChevronDown size={17} />
					</button>
				</nav>
				<button
					aria-label="Open navigation"
					className="icon-button mobile-menu"
					onClick={() => setPanel("shop")}
					type="button"
				>
					<Menu size={22} />
				</button>
				<Link aria-label="ocdly home" className="wordmark" to="/">
					ocdly
				</Link>
				<div className="header-actions">
					<button
						aria-label="Search collection"
						className="header-search"
						onClick={() => setPanel("search")}
						type="button"
					>
						<span>Search</span>
						<Search size={17} />
					</button>
					<Link
						aria-label="Your account"
						className="icon-button account-button"
						to="/account"
					>
						<UserRound size={18} />
					</Link>
					<button
						aria-label={`Wishlist, ${saved.length} saved items`}
						className="icon-button wishlist-button"
						onClick={() => setPanel("wishlist")}
						type="button"
					>
						<Heart size={19} />
					</button>
					<button
						aria-label={`Open cart, ${count} items`}
						className="bag-button"
						onClick={() => setPanel("cart")}
						type="button"
					>
						<ShoppingBag size={18} />
						<span>Cart ({count})</span>
					</button>
				</div>
			</header>
			<Outlet />
			<section className="newsletter-section">
				<div>
					<p>Stay in our world</p>
					<h2>A closer connection.</h2>
					<span>
						New T-shirts, original prints, and notes from inside ocdly.
					</span>
				</div>
				<form
					onSubmit={(event) => {
						event.preventDefault();
						setSubscribed(true);
					}}
				>
					<label htmlFor="newsletter-email">Your email address</label>
					<div className="newsletter-input">
						<input
							autoComplete="email"
							id="newsletter-email"
							onChange={() => setSubscribed(false)}
							placeholder="Enter your email"
							required
							type="email"
						/>
						<button aria-label="Subscribe to newsletter" type="submit">
							{subscribed ? <Check size={23} /> : <ArrowRight size={23} />}
						</button>
					</div>
					<p role="status">
						{subscribed
							? "Thank you for your interest. Demo only — your email was not saved or sent."
							: "Demo only. Your email is not collected."}{" "}
						<Link params={{ slug: "privacy" }} to="/pages/$slug">
							Privacy policy
						</Link>
					</p>
				</form>
			</section>
			<footer className="store-footer">
				<div className="footer-main">
					<div className="footer-brand">
						<Link className="wordmark" to="/">
							ocdly
						</Link>
						<p>
							Everyday pieces.
							<br />A point of view.
						</p>
						<span>India</span>
					</div>
					<div className="footer-group">
						<h2>ocdly</h2>
						{informationPages.slice(0, 3).map((page) => (
							<Link
								key={page.slug}
								params={{ slug: page.slug }}
								to="/pages/$slug"
							>
								{page.title}
							</Link>
						))}
					</div>
					<div className="footer-group">
						<h2>Client services</h2>
						{informationPages.slice(3).map((page) => (
							<Link
								key={page.slug}
								params={{ slug: page.slug }}
								to="/pages/$slug"
							>
								{page.title}
							</Link>
						))}
					</div>
					<div className="footer-group">
						<h2>Community</h2>
						<span>Social channels coming soon</span>
					</div>
				</div>
				<div className="footer-bottom">
					<span>© {new Date().getFullYear()} ocdly storefront preview.</span>
					<span>Original preview imagery. No purchases are processed.</span>
					<button onClick={() => setCookies(true)} type="button">
						Cookie preferences
					</button>
				</div>
			</footer>
			<Link
				className="help-button"
				params={{ slug: "contact" }}
				to="/pages/$slug"
			>
				<MessageCircle size={15} />
				<span>Can we help?</span>
			</Link>
			{cookies ? (
				<aside aria-label="Cookie preferences" className="cookie-notice">
					<h2>A little about cookies</h2>
					<p>
						We use local storage to remember your cart and wishlist. No
						advertising cookies, just the essentials.
					</p>
					<div className="cookie-actions">
						<Link
							className="text-button"
							onClick={() => setCookies(false)}
							params={{ slug: "privacy" }}
							to="/pages/$slug"
						>
							Learn more
						</Link>
						<button
							className="cookie-accept"
							onClick={acceptCookies}
							type="button"
						>
							Got it <Check size={13} />
						</button>
					</div>
				</aside>
			) : null}
			<StoreOverlays onClose={() => setPanel(null)} panel={panel} />
		</div>
	);
}
