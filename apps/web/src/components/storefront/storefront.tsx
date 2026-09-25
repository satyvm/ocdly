// biome-ignore-all lint/performance/noJsxPropsBind: Handlers target native controls and use item-specific values.
import { useNavigate } from "@tanstack/react-router";
import {
	ArrowDown,
	ArrowUpRight,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { type Category, filterProducts } from "@/lib/catalog";
import { useCatalog } from "@/lib/catalog-context";
import { collectionSlug } from "@/lib/store-pages";
import { toggleSaved, useWishlist } from "@/lib/wishlist";
import { ProductCard } from "./product-card";

const campaigns = [
	{
		alt: "Two ocdly models wearing plain and printed T-shirts",
		category: "All" as Category,
		cta: "Shop the collection",
		image: "/images/ocdly-hero.png",
		title: "The first ocdly edit",
	},
	{
		alt: "ocdly original printed T-shirt",
		category: "All" as Category,
		cta: "Explore printed tees",
		image: "/images/printed-tee-one-more-scroll.png",
		title: "Prints from real life",
	},
];
const collectionTitles: Record<Category, string> = {
	All: "New In",
	Shirts: "Shirts",
	"T-shirts": "T-shirts",
};
export function Storefront() {
	const products = useCatalog();
	const [slide, setSlide] = useState(0);
	const [category, setCategory] = useState<Category>("All");
	const [sort, setSort] = useState("featured");
	const saved = useWishlist();
	const navigate = useNavigate();
	const campaign = campaigns[slide] ?? campaigns[0];
	const visibleProducts = filterProducts(products, category).sort((a, b) => {
		if (sort === "price-low") {
			return a.price - b.price;
		}
		if (sort === "price-high") {
			return b.price - a.price;
		}
		return 0;
	});
	function chooseCategory(next: Category) {
		navigate({
			params: { category: collectionSlug(next) },
			search: { q: "", sort: "featured" },
			to: "/collections/$category",
		});
	}
	return (
		<main id="main-content">
			<section aria-label="Latest campaigns" className="campaign-hero">
				<div
					className="hero-backdrop"
					style={{ backgroundImage: `url(${campaign.image})` }}
				/>
				<div className="hero-wash" />
				<div className="hero-topline">
					<span>Made in India. Shaped by everyday culture.</span>
					<span>First release / 2026</span>
				</div>
				<div className="campaign-frame" key={slide}>
					<img
						alt={campaign.alt}
						className="campaign-image"
						fetchPriority="high"
						height="810"
						src={campaign.image}
						width="1440"
					/>
					<div className="campaign-shade" />
					<div className="campaign-copy">
						<p>ocdly presents</p>
						<h1>{campaign.title}</h1>
						<button
							className="pill campaign-cta"
							onClick={() => {
								chooseCategory(campaign.category);
							}}
							type="button"
						>
							{campaign.cta}
							<ArrowUpRight size={15} />
						</button>
					</div>
					<span className="campaign-location">India</span>
					<span className="campaign-edition">
						{String(slide + 1).padStart(2, "0")} / 02
					</span>
				</div>
				<div className="hero-bottom">
					<button
						className="discover-link"
						onClick={() => {
							document
								.getElementById("discover")
								?.scrollIntoView({ behavior: "smooth" });
						}}
						type="button"
					>
						Discover New In <ArrowDown size={14} />
					</button>
					<div className="carousel-control">
						<button
							aria-label="Previous campaign"
							onClick={() => {
								setSlide((slide + 1) % 2);
							}}
							type="button"
						>
							<ChevronLeft size={15} />
						</button>
						{campaigns.map((item, index) => (
							<button
								aria-label={`Show ${item.title}`}
								aria-pressed={slide === index}
								className={`carousel-dot ${slide === index ? "active" : ""}`}
								key={item.title}
								onClick={() => {
									setSlide(index);
								}}
								type="button"
							>
								<span />
							</button>
						))}
						<button
							aria-label="Next campaign"
							onClick={() => {
								setSlide((slide + 1) % 2);
							}}
							type="button"
						>
							<ChevronRight size={15} />
						</button>
					</div>
					<span className="hero-note">Made of what we believe.</span>
				</div>
			</section>

			<section
				aria-label="Shop by category"
				className="category-section"
				id="discover"
			>
				<div className="section-intro">
					<span>A small beginning. A distinct point of view.</span>
					<span>Men's T-shirts, first</span>
				</div>
				<div className="category-grid">
					{(["All"] as const).map((name) => (
						<button
							className="category-panel"
							key={name}
							onClick={() => {
								chooseCategory(name);
							}}
							type="button"
						>
							<img
								alt="ocdly men's T-shirt launch collection"
								height="1498"
								loading="lazy"
								src="/images/ocdly-hero.png"
								width="1266"
							/>
							<div className="category-shade" />
							<div className="category-copy">
								<span>Explore</span>
								<h2>T-shirts</h2>
							</div>
							<span className="category-arrow">
								<ArrowUpRight size={24} strokeWidth={1} />
							</span>
						</button>
					))}
				</div>
			</section>

			<section
				aria-labelledby="collection-title"
				className="collection-section"
				id="collection"
			>
				<div className="collection-heading">
					<div>
						<p>The latest chapter</p>
						<h2 id="collection-title">{collectionTitles[category]}</h2>
					</div>
					<span>Plain essentials. Original prints. ocdly by design.</span>
				</div>
				<div className="collection-toolbar">
					<fieldset className="category-tabs">
						<legend className="sr-only">Filter collection</legend>
						{(["All"] as Category[]).map((item) => (
							<button
								aria-pressed={category === item}
								className={category === item ? "active" : ""}
								key={item}
								onClick={() => {
									setCategory(item);
								}}
								type="button"
							>
								New In
							</button>
						))}
					</fieldset>
					<label className="sort-control">
						<span className="sr-only">Sort products</span>
						<select
							onChange={(event) => {
								setSort(event.target.value);
							}}
							value={sort}
						>
							<option value="featured">Featured</option>
							<option value="price-low">Price: low to high</option>
							<option value="price-high">Price: high to low</option>
						</select>
					</label>
				</div>
				{visibleProducts.length > 0 ? (
					<div className="product-grid">
						{visibleProducts.map((item) => (
							<ProductCard
								key={item.id}
								onSave={toggleSaved}
								product={item}
								saved={saved.includes(item.id)}
							/>
						))}
					</div>
				) : (
					<div className="page-empty">
						<h2>The first pieces are being prepared.</h2>
						<p>
							The catalogue is connected, but no products are published in this
							edit yet.
						</p>
					</div>
				)}
				<div className="collection-bottom">
					<span>{visibleProducts.length} pieces to make your own</span>
					<button
						className="text-button"
						onClick={() => {
							navigate({ search: { q: "", sort: "featured" }, to: "/search" });
						}}
						type="button"
					>
						Find your next piece <ArrowUpRight size={15} />
					</button>
				</div>
			</section>

			<section className="editorial-section">
				<span className="editorial-kicker">The idea behind ocdly</span>
				<h2>
					Easy to wear.
					<br />
					Hard to forget.
				</h2>
				<p>
					Plain T-shirts anchor the everyday. Original prints turn the internet,
					humour, and shared moments into something worth wearing.
					<br className="desktop-break" /> Designed in India for wherever the
					day goes next.
				</p>
				<button
					className="text-button"
					onClick={() => {
						navigate({ params: { slug: "our-story" }, to: "/pages/$slug" });
					}}
					type="button"
				>
					Explore our universe <ArrowUpRight size={15} />
				</button>
				<span className="editorial-coordinate">
					Plain now &nbsp; Prints next
				</span>
			</section>

			<section className="footwear-campaign">
				<img
					alt="ocdly One More Scroll printed T-shirt"
					height="1080"
					loading="lazy"
					src="/images/printed-tee-one-more-scroll.png"
					width="1920"
				/>
				<div className="footwear-copy">
					<p>A familiar feeling, drawn differently</p>
					<h2>One More Scroll — Printed Tee</h2>
					<button
						className="pill"
						onClick={() => {
							chooseCategory("All");
						}}
						type="button"
					>
						Explore printed tees <ArrowUpRight size={15} />
					</button>
				</div>
			</section>
		</main>
	);
}
