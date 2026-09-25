import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Breadcrumb, PageHeading } from "@/components/storefront/page-parts";
import { findInformation, informationPages } from "@/lib/store-pages";
export const Route = createFileRoute("/_store/pages/$slug")({
	loader: ({ params }) => {
		const page = findInformation(params.slug);
		if (!page) {
			throw notFound();
		}
		return page;
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `${loaderData?.title ?? "Information"} — ocdly`,
			},
		],
	}),
	component: InformationPage,
});
function InformationPage() {
	const page = Route.useLoaderData();
	return (
		<main className="store-page information-page" id="main-content">
			<Breadcrumb name={page.title} />
			<div className="information-layout">
				<nav aria-label="About and client services">
					{informationPages.map((item) => (
						<Link
							aria-current={item.slug === page.slug ? "page" : undefined}
							key={item.slug}
							params={{ slug: item.slug }}
							to="/pages/$slug"
						>
							{item.title}
						</Link>
					))}
				</nav>
				<article>
					<PageHeading subtitle={page.subtitle} title={page.title} />
					{page.image ? (
						<img
							alt={`${page.title} — ocdly campaign`}
							className="information-photo"
							height={941}
							src={page.image}
							width={1672}
						/>
					) : null}
					{page.sections.map((section) => (
						<section className="information-section" key={section.title}>
							<h2>{section.title}</h2>
							<p>{section.text}</p>
						</section>
					))}
					<Link
						className="text-button"
						params={{ category: "new-in" }}
						search={{ q: "", sort: "featured" }}
						to="/collections/$category"
					>
						Explore New In
					</Link>
				</article>
			</div>
		</main>
	);
}
