# Coolify staging

Staging uses one Git-backed Coolify Docker Compose application from
`satyvm/ocdly` on `main`. Its Compose file is `/docker-compose.coolify.yml`.
The storefront, API, and Commerce share a private Compose network. Two
Postgres services keep their databases separate. The staging file uses
Coolify's `exclude_from_hc` setting for one-shot jobs; use
`docker-compose.yml` for ordinary local Docker Compose. Only these services
receive public domains:

| Service | Coolify domain value | Public URL |
| --- | --- | --- |
| `web` | `https://ocdly.blckh.top:3001` | `https://ocdly.blckh.top` |
| `server` | `https://api.ocdly.blckh.top:3000` | `https://api.ocdly.blckh.top` |
| `commerce` | `https://commerce.ocdly.blckh.top:3050` | `https://commerce.ocdly.blckh.top` |

The port in each Coolify domain selects the container port; visitors use
normal HTTPS. Point DNS for all three hostnames to the Coolify server. Keep
`ocdly.com` for a later production deployment.

## Set up the application

1. Create one Docker Compose resource from the repository and `main` branch
   in the **staging** environment.
2. Set **Base Directory** to `/` and **Docker Compose Location** to
   `/docker-compose.coolify.yml`.
3. Save and reload the Compose configuration, then assign the domains above.
   Leave `postgres`, `migrate`, `commerce-postgres`, `commerce-seed`, and
   `commerce-worker` without domains.
4. Disable **Inject Build Args to Dockerfile**. The application Dockerfile
   receives its staging API URL from the Compose build argument.
5. Set these Coolify environment variables with unique values:

```dotenv
POSTGRES_PASSWORD=<storefront-database-password>
COMMERCE_POSTGRES_PASSWORD=<commerce-database-password>
BETTER_AUTH_SECRET=<random-string-at-least-32-characters>
VENDURE_CHANNEL_TOKEN=<random-channel-token>
VENDURE_IDENTITY_SECRET=<shared-random-secret-at-least-32-characters>
VENDURE_SUPERADMIN_USERNAME=<private-admin-username>
VENDURE_SUPERADMIN_PASSWORD=<long-unique-password>
VENDURE_COOKIE_SECRET=<random-string-at-least-32-characters>
```

The Compose file uses `http://commerce:3050/shop-api` for calls from the
storefront and API. It sets the public Commerce asset URL, CORS origin, and
Better Auth URLs for the staging domains. No `VENDURE_SHOP_API_URL`,
`VENDURE_ASSET_URL`, `VENDURE_CORS_ORIGINS`, `VITE_SERVER_URL`,
`BETTER_AUTH_URL`, `CORS_ORIGIN`, or `DATABASE_URL` setting is needed in
Coolify. Keep secrets in Coolify, not in Git.

## Deploy and verify

Deploy once. The two Postgres services become healthy; `migrate` applies the
Better Auth schema and `commerce-seed` initializes or updates the reviewed
catalogue. The API waits for both migration completion and a healthy Commerce
server; the web service waits for the API. The Commerce worker starts after
seeding. The application and Commerce each build one image, shared by their
related services.

Check that both one-shot jobs exit with code 0 and the three public services
become healthy. Then open:

- `https://commerce.ocdly.blckh.top/health`
- `https://commerce.ocdly.blckh.top/dashboard/`
- `https://api.ocdly.blckh.top/`
- `https://ocdly.blckh.top/`

Sign in to the Commerce Dashboard and confirm a product appears in the
storefront. If Coolify reports **No Available Server**, check the service
health and the internal port in its domain value.

## Existing data and backups

The volumes `ocdly_postgres_data`, `commerce_postgres_data`, and
`commerce_assets` persist across normal redeployments. A new single-resource
Compose project does **not** automatically attach volumes from the former two
Coolify applications. Back up both databases and Commerce assets, restore them
to the new resource, and retain the existing database passwords and channel
token when migrating. Verify the new resource before removing either old one.
Configure scheduled backups for both databases and the asset volume.

## Phone sign-in

`OTP_PROVIDER` defaults to `disabled` in staging. To enable WhatsApp codes,
set `OTP_PROVIDER=whatsapp` and the four `WHATSAPP_*` variables in Coolify:
access token, phone number ID, approved authentication template name, and
template language. Verify a real code round trip before relying on phone
sign-in. Email/password remains available while OTP delivery is disabled.

Staging uses a development payment handler and preview catalogue data. It is
not configured to charge customers. Production infrastructure and the
`ocdly.com` domain will be designed separately.
