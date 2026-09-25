# ocdly Technology Plan — v1

Lean commerce infrastructure for a product-first Indian fashion brand.

> **Principle:** Spend engineering time only where it creates a distinctive
> ocdly experience. Use an open-source commerce engine for commodity commerce
> logic; preserve the custom storefront and future outfit/wardrobe product
> layer.

Current direction: men's fashion first, positioned on the premium side with a
quality target comparable to established global high-street brands. Initial
assortment: high-quality plain T-shirts plus original printed T-shirts inspired
by relatable/popular internet culture; later expansion into polos, linen
shirts, jeans, trousers, sweatpants, Indian/Japanese-influenced shirts and
pants, footwear, and eventually women's fashion.

## 1. Commerce engine: Vendure vs Medusa

| Dimension | Vendure | Medusa |
| --- | --- | --- |
| Core approach | Headless commerce framework centered on Shop/Admin GraphQL APIs, plugins, custom fields and explicit commerce state machines. | Headless commerce framework centered on REST APIs, domain modules and composable workflows. |
| Backend shape | TypeScript; built around Vendure Core with separate Shop/Admin APIs and worker/job capabilities. | TypeScript/Node; API routes -> workflows -> modules -> PostgreSQL, with optional infrastructure providers such as Redis. |
| Storefront fit | Excellent. Your TanStack Start storefront can consume the Shop GraphQL API directly. | Excellent. Your TanStack Start storefront can consume the Store REST API/SDK. |
| Product/variant/inventory/order primitives | Strong built-in product variants, inventory, order/payment/fulfillment entities and configurable processes. | Strong built-in Product, Inventory, Cart, Order, Payment, Pricing, Promotion, Tax and Fulfillment modules. |
| Customisation style | Plugins + custom entities/fields + GraphQL extensions + configurable payment/fulfillment/order strategies. | Custom modules + data models + API routes + workflows + providers + admin extensions. |
| Admin | Built-in Dashboard/Admin API and extensible admin UI. | Built-in Medusa Admin and extensible widgets/pages/settings. |
| Cashfree / Delhivery | Plan for small custom integrations/plugins rather than making the architecture depend on a third-party plugin. | Plan for custom payment/fulfillment providers for the same reason. |
| Future outfit/wardrobe features | Good fit: keep editorial outfit and wardrobe domains outside the core sellable-product model; expose them via a plugin or app service. | Also a good fit: custom modules/workflows can model those domains. |
| API preference | GraphQL is attractive for your highly visual/custom storefront because a page can request precisely the product/outfit graph it needs. | REST is simpler if you strongly prefer conventional endpoints and SDK-driven client code. |
| License | Community core is GPLv3; Vendure provides a plugin exception allowing separately distributed plugins under other licenses. Calling its GraphQL API does not make the storefront GPL. | Core uses MIT; current project follows an open-core model, with some enterprise materials commercially licensed. |
| Best reason to choose it | Explicit commerce model, strong TypeScript extension points, and a clean fit for a bespoke experience on top of standard commerce. | Very modular architecture and workflows; attractive when you want to compose many custom domain modules around commerce. |
| Decision for ocdly | **CHOSEN** | Strong fallback; no need to switch unless implementation experience reveals a concrete blocker. |

**Decision:** Use Vendure. Medusa is not "worse"; it is simply not giving
ocdly enough extra value to justify revisiting the choice right now. Keep the
storefront independent so this remains reversible.

## 2. Authentication: phone-first from day one

**Revised decision:** keep Better Auth and launch with phone-number + OTP
authentication. The earlier guest-checkout suggestion was about conversion
friction and avoiding two identity systems—not because accounts are
undesirable. ocdly has enough future account utility (addresses, order
history, saved outfits, wardrobe) to justify identity from the start.

- Do not require login to browse products, read editorial content, explore
  outfits, or add items to the bag.
- Require/offer phone -> OTP when the user checks out, saves an outfit,
  follows/likes an item, or enters the future wardrobe experience.
- Phone number is the primary identifier. Email is secondary and can be
  requested at checkout or later for receipts/marketing with consent.
- Better Auth's phone-number plugin supports OTP verification and can
  automatically create a user when the OTP is verified.
- Rate-limit OTP sends and verification attempts; use an SMS/WhatsApp OTP
  provider and keep the provider behind a small interface so it can change
  later.

### Better Auth + Vendure identity boundary

Recommended: Better Auth owns the ocdly application identity. Vendure owns the
commerce Customer. Add a small Vendure authentication strategy/plugin that
trusts a verified Better Auth identity, finds or creates the corresponding
Vendure Customer, and starts the Vendure session. Vendure explicitly supports
external `AuthenticationStrategy` implementations and provides helper APIs for
external customer identities.

Why keep Better Auth instead of making Vendure the only identity system? Your
roadmap extends beyond purchasing. A digital wardrobe, saved outfits,
preferences and other personal fashion features are application-level identity
concerns. Keeping Better Auth as the primary identity avoids coupling those
features to the commerce engine.

## 3. Why some Indian sites already know your address

The address is normally coming from one of four places:

- **The store itself:** the shopper used the same phone/account before and
  saved an address.
- **A one-click-checkout network:** providers such as Cashfree Checkout360,
  GoKwik and Razorpay Magic Checkout can recognise a verified phone number and
  offer address data previously saved in their network, subject to their
  product terms and user verification/consent.
- **Browser/OS autofill:** Chrome, Safari, Android or iOS may offer a
  locally/cloud-saved address.
- **Pincode enrichment:** entering a pincode can fill city/state, but it cannot
  legitimately invent the street/house address by itself.

> **ocdly decision:** Start with your own phone-OTP account plus addresses
> stored against the commerce customer. Evaluate Cashfree Checkout360
> separately from the base Cashfree Payment Gateway if its address-prefill
> experience, commercials and branding controls are attractive. Do not design
> the core account system around access to a checkout provider's network data.

## 4. Product and experience model

### 4.1 Sellable products

Vendure owns: products, variants/SKUs, inventory/preorder capacity, pricing,
promotions, cart/order, payment, fulfillment, returns/refunds and customer
commerce records.

- Initial categories: plain premium T-shirts and original printed T-shirts.
- Variants should represent the actual sellable stock unit: e.g. Tee / Black /
  M.
- Fashion fields can be added as custom fields: fabric, composition, GSM, fit,
  care, HSN, country of origin, size chart, model measurements, collection,
  dispatch window and preorder metadata.

### 4.2 Outfit-first discovery — a core differentiator

Create a separate Outfit domain rather than pretending every item shown in an
outfit is an ocdly SKU. An Outfit is editorial/curation content that can mix
your products and external products.

| Entity | Purpose / key fields |
| --- | --- |
| Outfit | title, slug, hero images, story/occasion, season, tags, curator, publication status |
| OutfitItem — internal | links to an ocdly product/variant; position/layer; optional styling note |
| OutfitItem — external | brand, product name, outbound URL, price snapshot if shown, disclosure/affiliate metadata, optional permitted image/reference |
| Look / collection | groups outfits into themes such as office, date night, minimal, streetwear, travel, summer, Japanese-inspired |

Important product principle: ocdly is not only "a shop". It should help the
customer dress better even when the best item for a look comes from another
brand. That means the outfit layer should be first-class navigation: homepage
-> outfit/look -> shoppable pieces -> ocdly checkout or external outbound
link.

### 4.3 Future digital wardrobe

Do not build it now, but reserve the domain boundary. Later the account can
own:

- `WardrobeItem`: an item the user owns, from ocdly or any other brand.
- Wardrobe metadata: category, colour, fit, season, occasion, image and
  optional source/product link.
- Saved/generated Outfit: combinations of `WardrobeItems` and/or recommended
  products.
- Daily outfit workflow: choose constraints such as weather/occasion/style and
  surface combinations.

**Architecture rule:** keep Wardrobe/Outfit logic in an ocdly application
module/service. Vendure remains the commerce source of truth, not the entire
product experience.

## 5. Payments and shipping

### Cashfree

- Use Cashfree Payment Gateway for launch; do not add FlowWise while there is
  only one gateway.
- Create payment orders server-side, treat signed webhook/server verification
  as payment truth, and make processing idempotent.
- Keep a payment-provider adapter so Razorpay/PhonePe or FlowWise can be
  introduced later without rewriting commerce logic.
- Evaluate Checkout360 separately if the network address-prefill/one-click-
  checkout experience is worth the trade-off in control and commercials.

### Delhivery One

- Launch with manual shipment creation in Delhivery One. This is intentionally
  acceptable at low order volume.
- First useful automation: pincode/serviceability check before payment.
- Later: shipment creation -> AWB/label -> tracking -> cancellation/NDR/RTO/
  reverse pickup integration when manual work becomes material.

## 6. Updated stack boundary

| Layer | Choice |
| --- | --- |
| Store experience | TanStack Start + TypeScript + TailwindCSS + shadcn/ui |
| Commerce engine | Vendure + PostgreSQL |
| Identity | Better Auth — phone/OTP primary, email secondary |
| Custom application APIs | Hono + oRPC where functionality is not owned by Vendure |
| Custom app data | Drizzle + PostgreSQL for editorial outfits / wardrobe / other non-commerce domains as needed |
| Payments | Cashfree Payment Gateway |
| Shipping | Delhivery One; manual first |
| Assets | Cloudflare R2 or equivalent S3-compatible object storage |
| Workspace/tooling | Turborepo + Bun where compatible + Biome + Playwright |
| Observability | Error tracking, uptime checks, DB backups, payment-webhook alerting |

## 7. Tech roadmap — enough detail for now

| Phase | Outcome |
| --- | --- |
| T0 | Freeze boundaries: TanStack = experience; Vendure = commerce; Better Auth = identity; ocdly app modules = outfits/wardrobe. |
| T1 | Bring up Vendure + PostgreSQL locally and connect the existing storefront to a real catalogue. |
| T2 | Model T-shirts correctly: products, size/colour variants, SKUs, fashion custom fields, inventory/preorder rules. |
| T3 | Implement Better Auth phone OTP and map authenticated users to Vendure Customers. |
| T4 | Replace local bag/mock checkout with real Vendure active-order/cart flow. |
| T5 | Checkout: address, shipping/serviceability, server-calculated totals, Cashfree Payment Gateway. |
| T6 | Merchant operations: order states, payment/refund handling, invoices, customer notifications. |
| T7 | Manual Delhivery fulfillment first; automate only the highest-value steps as volume grows. |
| T8 | Build the Outfit editorial model and outfit-first browse pages. External pieces are outbound links, not fake catalogue items. |
| T9 | Deploy staging + production, backups, monitoring and end-to-end failure tests. |
| Later | Digital wardrobe, outfit generation, recommendations, loyalty, advanced search, multiple gateways/FlowWise and deeper logistics automation only when usage justifies them. |

## 8. Things deliberately deferred

Do not build these merely because they are interesting: Kubernetes/
microservices, multiple payment gateways, FlowWise, automated COD risk scoring,
full shipping API automation, AI stylist, recommendation engine, loyalty
system, native mobile app, advanced search, multi-warehouse, international
commerce, or the digital wardrobe itself. Build them when a real customer/
operations problem earns them.

## 9. Sources checked for this revision

- Vendure Developer Hub / APIs / extensions: <https://docs.vendure.io/>
- Vendure external authentication:
  <https://docs.vendure.io/current/core/reference/typescript-api/auth/external-authentication-service>
- Vendure licensing FAQ:
  <https://github.com/vendurehq/vendure/blob/master/license/license-faq.md>
- Medusa architecture:
  <https://docs.medusajs.com/learn/introduction/architecture>
- Medusa commerce modules:
  <https://docs.medusajs.com/resources/commerce-modules>
- Better Auth phone-number plugin:
  <https://better-auth.com/docs/plugins/phone-number>
- Cashfree Checkout360 / address prefill:
  <https://www.cashfree.com/one-click-checkout/>
- GoKwik checkout / network address prefill:
  <https://www.gokwik.co/product/kwikcheckout>
- Razorpay Magic Checkout flow:
  <https://razorpay.com/docs/payments/magic-checkout/how-it-works/>

---

This Markdown companion preserves the content of the user-authored
[`ocdly-tech-plan-v1.docx`](./ocdly-tech-plan-v1.docx). Formatting has been
adapted for repository rendering; architecture decisions are unchanged.
