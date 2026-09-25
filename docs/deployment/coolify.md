# Coolify deployment

The production-like beta uses two Git-backed Docker Compose applications in one
Coolify project. Both applications use `satyvm/ocdly` on the `main` branch:

| Application | Compose file | Public services |
| --- | --- | --- |
| Storefront | `/docker-compose.coolify.yml` | `web`, `server` |
| Commerce | `/apps/commerce/compose.coolify.yml` | `server` |

The Compose files use `expose`, not `ports`. Postgres, migration, seed and
worker containers remain private on their application's default Docker network.
Coolify's proxy is the only public entry point.
The Coolify files contain `exclude_from_hc` for one-shot jobs. Standard Docker
Compose rejects that Coolify-only field, so use the local Compose files for
ordinary local development.

## Keep builds within the server's capacity

Coolify builds Git-backed images on the deployment server by default. The
Storefront Compose file builds one image for `server`, `web` and `migrate`;
Commerce builds one image for `server`, `seed` and `worker`. A push can still
start both applications at the same time. In **Configuration -> General ->
Build -> Watch Paths**, set Storefront to:

```text
docker-compose.coolify.yml
apps/server/**
apps/web/**
packages/**
bun.lock
package.json
tsconfig.json
turbo.json
bunfig.toml
.dockerignore
```

Set Commerce to:

```text
apps/commerce/**
packages/**
bun.lock
package.json
tsconfig.json
turbo.json
bunfig.toml
.dockerignore
```

Watch Paths prevent an unrelated app from rebuilding for a one-app change. For
a commit that touches both applications or shared files, turn off **Auto Deploy**
for one application under **Configuration -> Advanced -> Deployment & Git**
before pushing. Deploy Commerce first, wait for its health check, then deploy
Storefront and re-enable Auto Deploy. A dedicated Coolify build server is the
longer-term way to keep build CPU and memory off the production host.

## Domains

Configure these domains on the matching Coolify service card:

| Application/service | Domain value in Coolify |
| --- | --- |
| Storefront / `web` | `https://ocdly.com:3001` |
| Storefront / `server` | `https://api.ocdly.com:3000` |
| Commerce / `server` | `https://commerce.ocdly.com:3050` |

The port suffix selects the internal container port. Visitors still use normal
HTTPS without typing the port.

Use `https://ocdly.com` as the canonical storefront origin. Do not mix
it with `https://www.ocdly.com` in CORS settings. Add a redirect for the
`www` hostname later if both hostnames are desired.

Coolify generates `SERVICE_URL_WEB`, `SERVICE_FQDN_WEB`,
`SERVICE_URL_SERVER` and `SERVICE_FQDN_SERVER` from these domain fields.
Do not manually create or edit those generated variables.

## Storefront application

1. In the production environment, select **New resource -> Private Repository
   (with GitHub App)**.
2. Select this repository and the `main` branch.
3. Choose **Docker Compose** as the build pack.
4. Set **Base Directory** to `/`.
5. Set **Docker Compose Location** to
   `/docker-compose.coolify.yml`.
6. Save and reload the Compose configuration.
7. Assign the `web` and `server` domains from the table above.
8. Do not assign a domain to `postgres` or `migrate`.
9. Under **Configuration -> Advanced**, disable **Inject Build Args to
   Dockerfile**. The Dockerfile explicitly declares the only required build
   argument.

Set these production environment variables:

```dotenv
POSTGRES_PASSWORD=<strong-new-database-password>
BETTER_AUTH_SECRET=<random-string-at-least-32-characters>
VENDURE_SHOP_API_URL=https://commerce.ocdly.com/shop-api
VENDURE_CHANNEL_TOKEN=<same-random-token-as-commerce>
VENDURE_IDENTITY_SECRET=<same-new-random-secret-as-commerce>
```

Axiom is optional for the beta and is not mapped by the Coolify Compose file.
Delete the `AXIOM_API_KEY`, `AXIOM_DATASET` and `AXIOM_EDGE_URL`
placeholder entries. Add an explicit Compose mapping in a later observability
change when real Axiom credentials are available.

The application variables `VITE_SERVER_URL`, `BETTER_AUTH_URL`,
`CORS_ORIGIN` and `DATABASE_URL` do not appear as Compose keys. The shared
Storefront Dockerfile maps `PUBLIC_API_URL` to Vite at build time. The server
entrypoint derives the other three inside the container from Coolify's
generated `SERVICE_URL_*` values and the private `postgres:5432` service
address.

The one-shot `migrate` service runs the Drizzle migrations after Postgres is
healthy. The API starts only after that service succeeds. `server` builds the
Storefront image once; `web` and `migrate` use that same image. The Dockerfile
installs workspace dependencies once, then builds the API and web in sequence.
The migrations include Better Auth's database-backed rate-limit table.

## Commerce application

1. Create a second Git-backed Docker Compose application from the same
   repository and `main` branch.
2. Set **Base Directory** to `/`.
3. Set **Docker Compose Location** to
   `/apps/commerce/compose.coolify.yml`.
4. Save and reload the Compose configuration.
5. Assign `https://commerce.ocdly.com:3050` only to the `server`
   service.
6. Do not assign domains to `postgres`, `seed` or `worker`.

Set these production environment variables:

```dotenv
COMMERCE_POSTGRES_PASSWORD=<strong-new-database-password>
VENDURE_CHANNEL_TOKEN=<same-random-token-as-storefront>
VENDURE_CORS_ORIGINS=https://ocdly.com
VENDURE_SUPERADMIN_USERNAME=<private-admin-username>
VENDURE_SUPERADMIN_PASSWORD=<long-unique-password>
VENDURE_COOKIE_SECRET=<random-string-at-least-32-characters>
VENDURE_IDENTITY_SECRET=<same-new-random-secret-as-storefront>
```

The `seed` service waits for Postgres, creates the initial Vendure schema and
catalogue on an empty database, and then exits successfully. On an existing
database it leaves the schema unchanged. The Vendure server and worker start
only after seeding succeeds. Re-running the seed does not modify products
created in the Dashboard, but it reapplies reviewed metadata to the three
built-in seed products. `server` builds the image once; `seed` and `worker` use
it. Future schema changes to an existing database require a reviewed migration.
The public asset URL defaults to Coolify's generated `SERVICE_URL_SERVER`
followed by `/assets/`; no user-managed `VENDURE_ASSET_URL` is needed.

For a **new installation**, paste the two ignored local files
`.local/deployment/coolify-commerce.env` and
`.local/deployment/coolify-storefront.env` into their matching applications.
The files contain distinct generated credentials and one shared channel token.
They also contain one newly generated identity secret shared by the two apps.
They are local handoff files, never Git inputs or Docker build inputs.
In **Configuration -> Environment Variables -> Developer view**, append the
file's lines to the existing values, then save. Do not replace the entire view:
Coolify removes entries omitted from a Developer-view save, including generated
`SERVICE_URL_*` and `SERVICE_FQDN_*` values. Use Normal view for any locked
entry that Developer view cannot edit.

For an **existing Postgres volume**, preserve the current database password
in Coolify. Do not paste a newly generated `COMMERCE_POSTGRES_PASSWORD` or
`POSTGRES_PASSWORD` over it: Postgres does not change an initialized user's
password when the container environment changes. If using the file import,
replace that line with the existing value before importing. Also retain an
existing Commerce channel token if products have already been seeded, and use
that same token in Storefront. Keep the existing Vendure admin login until any
password change is confirmed in the Dashboard.

## Enable phone sign-in with WhatsApp

The identity bridge activates when both applications receive the same
`VENDURE_IDENTITY_SECRET`. Deploy Commerce with the new secret first, then
Storefront. This does not change either database password or volume. The
Storefront server uses its existing `VENDURE_SHOP_API_URL` and
`VENDURE_CHANNEL_TOKEN` to call the Commerce Shop API. A successful phone OTP
verification links the Better Auth user to a Vendure Customer; the account page
has a retry action if Commerce was temporarily unavailable.

Phone codes remain disabled until a Meta WhatsApp Business Platform account is
ready. Create and obtain approval for an **Authentication** template with a
**Copy code** button, then get the sender Phone Number ID and a system user
access token with `whatsapp_business_messaging` permission. Meta documents the
[template format](https://www.postman.com/meta/whatsapp-business-platform/request/6vkv46u/create-authentication-template-w-otp-copy-code-button)
and [Cloud API credentials](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api).
Use a 5-minute template expiration to match Better Auth's OTP lifetime.

Add these five user-managed variables to the **Storefront** application only:

```dotenv
OTP_PROVIDER=whatsapp
WHATSAPP_ACCESS_TOKEN=<system-user-access-token>
WHATSAPP_PHONE_NUMBER_ID=<sender-phone-number-id>
WHATSAPP_OTP_TEMPLATE_NAME=<approved-template-name>
WHATSAPP_OTP_TEMPLATE_LANGUAGE=en_US
```

Choose the template language code you actually approved. Save the variables,
redeploy Storefront, and verify with a phone that can receive WhatsApp messages.
The server rejects an incomplete WhatsApp configuration at startup. A successful
Cloud API response means Meta accepted the send request; complete a real OTP
round trip before treating delivery as working. Keep these credentials in
Coolify, not in the repository.

## First deployment

Deploy in this order:

1. Deploy Commerce.
2. Confirm `postgres` is healthy, `seed` exited with code 0, and both
   `server` and `worker` are running.
3. Open `https://commerce.ocdly.com/health`.
4. Open `https://commerce.ocdly.com/dashboard/`, sign in, change the
   temporary admin password if necessary, and upload a test product.
5. Deploy Storefront.
6. Confirm `postgres` is healthy, `migrate` exited with code 0, and
   `server` and `web` are healthy.
7. Open `https://api.ocdly.com/`, then
   `https://ocdly.com`.
8. Confirm the uploaded Vendure product appears in the storefront.

In both applications, remove any user-managed `NODE_ENV` that Coolify offers
as a build argument and disable **Inject Build Args to Dockerfile** under
**Configuration -> Advanced**. The Dockerfiles set their own install/build and
runtime environments.

If a domain reports **No Available Server**, verify the service is healthy and
that its Coolify domain includes the internal port suffix.

## Removing stale Coolify variables

Coolify refuses to delete a variable while the active Compose definition still
references it. To remove the old `VITE_SERVER_URL` variable:

1. Change the Storefront Compose Location to
   `/docker-compose.coolify.yml`.
2. Save and reload/reparse the Compose definition.
3. Confirm the rendered Compose uses
   `PUBLIC_API_URL: ${SERVICE_URL_SERVER:-http://localhost:3000}` as the shared
   image build argument and contains no `VITE_SERVER_URL` key.
4. Return to Environment Variables and delete the old user-managed
   `VITE_SERVER_URL`, `BETTER_AUTH_URL`, `CORS_ORIGIN` and
   `DATABASE_URL` entries.
5. Delete stale `NODE_ENV`, `AXIOM_API_KEY`,
   `AXIOM_DATASET` and `AXIOM_EDGE_URL` entries if Coolify imported them
   from the old Compose file.
6. Keep these required inputs:
   `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`,
   `VENDURE_SHOP_API_URL` and `VENDURE_CHANNEL_TOKEN`.
7. Keep the generated `SERVICE_URL_*` and `SERVICE_FQDN_*` entries.
8. Redeploy; use **Force deploy without cache** once because the public API URL
   is compiled into the web bundle.

If Coolify still reports that a removed key belongs to Compose after saving and
reparsing, keep the existing resource and capture the Storefront **Docker Compose
Content** view and the exact variable-deletion error for diagnosis.

## Pull-request previews

Enable previews on the Storefront application only:

1. Open **Configuration -> Advanced -> Deployment** and enable Preview
   Deployments.
2. Keep **Allow Public PR Deployments** disabled.
3. Create a wildcard DNS record for `*.preview.ocdly.com` pointing to
   the Coolify server.
4. Use `{{pr_id}}.preview.ocdly.com` as the preview URL template.
5. Add preview-scoped values for `POSTGRES_PASSWORD`,
   `BETTER_AUTH_SECRET`, `VENDURE_SHOP_API_URL` and
   `VENDURE_CHANNEL_TOKEN`.
6. Point preview deployments to this development Commerce instance or, later,
   to a separate staging Commerce instance.

Coolify generates preview-specific service URLs. Because the web build argument
is sourced from the generated server URL, each preview calls its own preview API
without a manually managed `VITE_SERVER_URL`.

Do not enable Commerce previews by default. A Commerce preview creates another
Postgres database, asset volume, server and worker for every pull request.

## Persistence and backups

The named volumes `ocdly_postgres_data`, `commerce_postgres_data` and
`commerce_assets` persist across normal redeployments. Configure scheduled
Coolify backups for both Postgres volumes before using the environment for
customer data. Back up `commerce_assets` as well until assets move to
S3-compatible object storage.

Never delete the applications, volumes, or storage entries when performing a
normal redeploy.

The rebrand changes the Storefront database name and named volume, the Commerce
database name, and the default channel token and catalogue SKUs. A fresh ocdly
deployment starts with empty databases. If migrating an existing deployment,
back up its databases and assets, migrate the data and volume mappings, and
preserve the existing channel token until the Commerce channel is updated.

## Current beta limitations

- `OTP_PROVIDER=disabled` means phone codes are not delivered. Email/password
  remains the usable account path until the WhatsApp credentials and template
  above are configured and a real delivery is verified.
- The current payment handler is not suitable for charging real customers.
- Rotate every shared development credential before treating this as a real
  production environment.
