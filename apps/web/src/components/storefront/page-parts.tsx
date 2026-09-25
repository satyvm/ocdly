import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Product } from "@/lib/catalog";
import { toggleSaved, useWishlist } from "@/lib/wishlist";
import { ProductCard } from "./product-card";

export function Breadcrumb({ name }: { name: string }) {
	return (
		<nav aria-label="Breadcrumb" className="breadcrumbs">
			<Link to="/">Home</Link>
			<span aria-hidden="true">/</span>
			<span aria-current="page">{name}</span>
		</nav>
	);
}
export function PageHeading({
	title,
	subtitle,
}: {
	title: string;
	subtitle?: string;
}) {
	return (
		<div className="page-heading">
			<h1>{title}</h1>
			{subtitle ? <p>{subtitle}</p> : null}
		</div>
	);
}
export function EmptyState({
	title,
	children,
}: {
	title: string;
	children?: ReactNode;
}) {
	return (
		<div className="page-empty">
			<h2>{title}</h2>
			{children}
			<Link
				className="solid-button"
				params={{ category: "new-in" }}
				search={{ q: "", sort: "featured" }}
				to="/collections/$category"
			>
				Explore the collection
			</Link>
		</div>
	);
}
export function ProductGrid({ items }: { items: Product[] }) {
	const saved = useWishlist();
	return (
		<div className="product-grid">
			{items.map((product) => (
				<ProductCard
					key={product.id}
					onSave={toggleSaved}
					product={product}
					saved={saved.includes(product.id)}
				/>
			))}
		</div>
	);
}
export function StoreNotFound() {
	return (
		<main className="store-page" id="main-content">
			<Breadcrumb name="Page not found" />
			<PageHeading
				subtitle="The link may have changed, or this piece is not part of our sample collection."
				title="This page isn’t here."
			/>
			<EmptyState title="Find something new." />
		</main>
	);
}
export function StoreLoading() {
	return (
		<main className="store-page" id="main-content">
			<PageHeading
				subtitle="Connecting to the ocdly catalogue."
				title="Loading the collection…"
			/>
		</main>
	);
}
export function StoreError() {
	return (
		<main className="store-page" id="main-content">
			<PageHeading
				subtitle="Please reload to try again."
				title="We couldn’t load this page."
			/>
			<a className="solid-button" href="/">
				Return home
			</a>
		</main>
	);
}
