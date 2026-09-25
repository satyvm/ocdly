# ocdly commerce

Vendure 3.7.3 owns the commerce boundary: catalogue, variants, inventory,
pricing, channels, orders, payments and fulfillment. It does not own ocdly
identity, editorial outfits or the future wardrobe domain.

## Local stack

From the repository root:

```bash
bun run docker:up
```

That command starts the whole local stack, including the separate Commerce
PostgreSQL service, idempotent seed, API and worker. The initial catalogue
contains 3 products and 15 tracked variants: Essential Heavyweight Tee, One
More Scroll Tee and Linen Ease Shirt.
Each colour/size variant has a stable SKU, on-hand inventory and an INR price.

Endpoints:

- Health: `http://localhost:3050/health`
- Shop GraphQL API: `http://localhost:3050/shop-api`
- Admin GraphQL API: `http://localhost:3050/admin-api`
- GraphiQL in development: `http://localhost:3050/graphiql`
- Assets: `http://localhost:3050/assets/...`
- Merchant Dashboard: `http://localhost:3050/dashboard/`

## Uploading products in the beta

Open the Merchant Dashboard and sign in with the Admin credentials below. The
Dashboard is the supported product-management surface; no code or CSV editing
is required for day-to-day catalogue work.

1. Open **Catalog -> Products -> New product**.
2. Add the English name, slug, description and product images.
3. Complete the fashion fields: fabric, composition, GSM, fit, care, HSN,
   country of origin, size chart, model measurements, collection and dispatch
   window.
4. Add `colour` and `size` option groups, then create the sellable variants.
5. Give every variant a stable unique SKU, INR price, stock count and image.
6. Keep **Track inventory** enabled. For normal stock, use an out-of-stock
   threshold of `0`.
7. Enable the variants and product, then add the product to the appropriate
   collection.

For a capped preorder, set the variant's **Preorder enabled** field, limit,
lead time and dispatch wording, then set Vendure's out-of-stock threshold to the
negative limit (a limit of 10 uses `-10`). The threshold is the enforcement
mechanism; the custom field explains the promise to the storefront.

The three seed products are safe to edit or disable. Do not delete or rename
their slugs/SKUs while the local seed container is enabled, because it
deliberately reapplies their reviewed metadata on restart. Products you create
in the Dashboard are not changed by the seed.
The local Admin API credentials are `admin@ocdly.local` /
`change-me-before-production`. They are deliberately development-only defaults;
production startup rejects missing credentials and secrets. The default channel
token is `ocdly-web`, sent as the `vendure-token` request header. The default
channel uses INR and tax-inclusive prices.

Stop the local stack with:

```bash
bun run docker:down
```

The database and uploaded-asset volumes remain available for the next start.

## Running without Compose

Copy `.env.example` to `.env`, run PostgreSQL on port 5433, then:

```bash
bun install
bun run --cwd apps/commerce db:seed
bun run --cwd apps/commerce dev
```

Run the worker separately with `bun run --cwd apps/commerce dev:worker`.

## Storefront query contract

The standard Shop API exposes the fields required by T1:

```graphql
query Catalogue {
  products {
    items {
      id
      slug
      name
      description
      featuredAsset { id preview source }
      assets { id preview source }
      facetValues { id name code facet { id name code } }
      customFields {
        fabric
        composition
        gsm
        fit
        care
        hsnCode
        countryOfOrigin
        sizeChart
        modelMeasurements
        collection
        dispatchWindow
      }
      variants {
        id
        name
        sku
        currencyCode
        price
        priceWithTax
        stockLevel
        options { id name code groupId }
        customFields {
          colourCode
          preorderEnabled
          preorderLimit
          preorderLeadTimeDays
          preorderDispatchWindow
        }
      }
    }
  }
}
```

Prices are integer minor units in GraphQL (`149900` means ₹1,499.00). The
storefront must not recalculate price or inventory locally.

## Fashion catalogue and inventory policy

`src/catalog/catalog-model.ts` is the reviewed seed contract layered on top of
the CSV importer. It gives every product fabric, composition, GSM, fit, care,
HSN, country-of-origin, size-chart, model, collection and dispatch metadata.
Every sellable variant is identified by a stable `OCDLY-...` SKU and has explicit
size and colour options in the CSV.

All variants use Vendure inventory tracking and override the global threshold.
Stocked-only variants use an out-of-stock threshold of zero. A preorder-enabled
variant uses a negative threshold equal to its preorder limit: for example,
`-10` permits at most ten units beyond on-hand stock. The matching custom fields
tell the storefront that the item is a preorder and provide its dispatch
expectation; they are not a second stock counter. Changing a preorder limit
requires changing both values together, which the catalog validator enforces.

The seed is repeatable. On an existing T1 database it leaves the imported
products intact and reapplies the reviewed metadata and inventory rules by
slug/SKU. Missing or renamed SKUs fail loudly rather than silently producing a
partially configured catalogue.

## Schema and migration policy

Normal server and worker configuration always has `synchronize: false`.
`db:seed` enables synchronization only when the Commerce schema has no tables,
so it can bootstrap a brand-new database. On an existing database it leaves the
schema unchanged. When products already exist, it reapplies the reviewed seed
metadata without duplicating the catalogue.

For every schema or plugin change:

```bash
bun run --cwd apps/commerce db:migration:generate -- DescriptiveName
bun run --cwd apps/commerce db:migrate
```

Review and commit the generated migration. Production should run migrations as
a release step before starting the API; the worker intentionally never runs
migrations. The beta Coolify stack also uses this seed path to bootstrap a new
database and reapply reviewed seed metadata on redeploy. Future schema changes
to an existing Commerce database require a reviewed migration.

## Root integration

The commerce package is wired into the root Bun workspace and Turbo pipeline.
Use the root scripts for common operations:

    bun run docker:up
    docker compose logs -f commerce commerce-worker
    bun run docker:down

For non-Compose development, commerce:dev, commerce:worker, commerce:seed, and
commerce:migrate delegate to package tasks through Turbo. The commerce database
stays isolated on port 5433 in ocdly_commerce; it does not share the application
schema.

## Scope notes

- The dummy payment handler is for local and staging use only. Cashfree belongs to T5.
- Standard delivery is a placeholder. Delhivery serviceability belongs to T5/T7.
- The Storefront API signs short-lived assertions for verified Better Auth phone
  users. When both applications share `VENDURE_IDENTITY_SECRET`, this Shop API
  strategy links the user to a Customer and stores the verified phone number.
  Production WhatsApp delivery requires Meta credentials and an approved
  authentication template; see `docs/deployment/coolify.md`.
- Preorder metadata and negative stock thresholds are development seed policy;
  merchant operations must review capacity and dispatch wording before launch.

Reference implementation choices follow the current Vendure documentation:
https://docs.vendure.io/current/core/deployment and the Vendure v3.7.3
server/worker scaffold.
