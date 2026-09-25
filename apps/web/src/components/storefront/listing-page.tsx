// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { Link } from "@tanstack/react-router";
import type { Category } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import {
	collections,
	listingProducts,
	type SortOrder,
} from "@/lib/store-pages";
import { Breadcrumb, EmptyState, PageHeading, ProductGrid } from "./page-parts";

export function ListingPage({
	category,
	title,
	subtitle,
	image,
	q,
	sort,
	onSearch,
}: {
	category: Category;
	title: string;
	subtitle?: string;
	image?: string;
	q: string;
	sort: SortOrder;
	onSearch: (value: { q: string; sort: SortOrder }) => void;
}) {
	const products = useCatalog();
	const items = listingProducts(products, category, q, sort);
	return (
		<main className="store-page listing-page" id="main-content">
			<Breadcrumb name={title} />
			{image ? (
				<section className="listing-banner">
					<img
						alt={`${title} campaign`}
						height={900}
						src={image}
						width={1600}
					/>
					<div>
						<h1>{title}</h1>
						<p>{subtitle}</p>
					</div>
				</section>
			) : (
				<PageHeading subtitle={subtitle} title={title} />
			)}
			<nav aria-label="Collections" className="collection-links">
				{collections.map((item) => (
					<Link
						aria-current={
							category === item.category && image ? "page" : undefined
						}
						key={item.slug}
						params={{ category: item.slug }}
						search={{ q: "", sort }}
						to="/collections/$category"
					>
						{item.name}
					</Link>
				))}
			</nav>
			<div className="listing-toolbar">
				<label className="listing-search">
					Search the collection
					<input
						maxLength={200}
						onChange={(event) => onSearch({ q: event.target.value, sort })}
						placeholder="Try linen, blue, or shoes"
						type="search"
						value={q}
					/>
				</label>
				<label className="sort-control">
					Sort products
					<select
						onChange={(event) =>
							onSearch({ q, sort: event.target.value as SortOrder })
						}
						value={sort}
					>
						<option value="featured">Featured</option>
						<option value="price-low">Price: low to high</option>
						<option value="price-high">Price: high to low</option>
					</select>
				</label>
			</div>
			<p className="result-count" role="status">
				{items.length} {items.length === 1 ? "piece" : "pieces"}
				{q ? ` matching “${q}”` : " in this edit"}
			</p>
			{items.length > 0 ? (
				<ProductGrid items={items} />
			) : (
				<EmptyState title="No pieces found.">
					<p>Try a different name or color, or clear your search.</p>
					<button
						className="text-button"
						onClick={() => onSearch({ q: "", sort })}
						type="button"
					>
						Clear search
					</button>
				</EmptyState>
			)}
		</main>
	);
}
