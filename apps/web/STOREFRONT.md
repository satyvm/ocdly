# ocdly storefront

The customer-facing ocdly experience, built with TanStack Start and backed by the Vendure catalogue.

## Run

From the repository root:

    bun install --frozen-lockfile
    bun run commerce:up
    VENDURE_SHOP_API_URL=http://localhost:3050/shop-api VITE_SERVER_URL=http://localhost:3000 bun run --cwd apps/web dev:bare --host 0.0.0.0 --port 3010 --strictPort

Open http://localhost:3010. On the tailnet, use the same port on this machine's ts.net hostname. The Vite server listens on all interfaces while Tailscale keeps access private. If the Vendure URL is omitted in development, a three-product preview catalogue keeps UI work unblocked. Production requires an explicit Vendure endpoint.

## Pages

- / — campaign homepage and New In preview.
- /collections/new-in, /collections/t-shirts, and /collections/shirts — catalogue pages with URL-backed search and sorting.
- /products/<slug> — product detail with size selection, wishlist, cart, and related pieces.
- /search, /wishlist, /bag, and /checkout — utility shopping routes.
- /account — guest account landing page.
- /pages/<slug> — brand, care, contact, delivery, and privacy pages.

## Included

- Responsive campaign carousel, category panels, editorial content, newsletter form, and footer on every page via a shared layout.
- A Vendure-backed catalogue with three seeded products and 15 size variants, mapped into a narrow storefront model.
- Required size selection, wishlist, and shopping bag with quantity controls and totals.
- Cart and wishlist persistence on the current device; updates synchronize between browser tabs.
- Native modal dialogs (mobile menu), keyboard navigation, focus restoration, and reduced-motion styles.
- Informational account, shipping, privacy, and help pages.

Checkout is intentionally not connected. The newsletter form validates input but never stores or sends an email address. No accounts, orders, payments, or shipping labels are created.

## Verification

    bun test apps/web/src/lib
    VITE_SERVER_URL=http://localhost:3000 bun run --cwd apps/web check-types
    bun run --cwd apps/commerce test
    bun run --cwd apps/commerce check-types

The catalogue tests cover Vendure response mapping, GraphQL failures, prices in minor units, and persisted cart variants.

## Content and assets

The development seed catalogue lives in apps/commerce/seed/products.csv; the storefront adapter lives in src/lib/vendure-catalog.ts. Preview imagery under public/images must be replaced with final owned or licensed production photography before launch. Seed descriptions, prices, inventory, and availability are development data, not live offers.

The preview retains a noindex, nofollow robots directive.
