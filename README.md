# ocdly

Staging storefront: [ocdly.blckh.top](https://ocdly.blckh.top). Source repository: [satyvm/ocdly](https://github.com/satyvm/ocdly). The `ocdly.com` domain is reserved for a later production deployment.

The storefront uses React and TanStack Start. The API uses Hono for authentication and Commerce account linking.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting
- **Turborepo** - Optimized monorepo build system

## Getting Started

Start the complete local stack with one command:

```bash
bun run docker:up
```

Open the storefront at [localhost:3001](http://localhost:3001), the API at
[localhost:3000](http://localhost:3000), and the Commerce Dashboard at
[localhost:3050/dashboard/](http://localhost:3050/dashboard/). The Compose
stack starts both databases, applies application migrations, seeds the Commerce
catalogue, and starts the web, API, Commerce server and worker. Stop it with:

```bash
bun run docker:down
```

For development outside Docker, run `bun install --frozen-lockfile` and use
the app-specific commands in [the storefront guide](apps/web/STOREFRONT.md)
and [the Commerce guide](apps/commerce/README.md).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@ocdly/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `bun run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node/Bun tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Deployment

### Alchemy

- Target: Axiom observability
- Configure provider accounts: `cd packages/infra && bunx alchemy profile edit`
- Dev: bun run dev
- Deploy: bun run deploy:infra
- Destroy: bun run destroy

`alchemy profile edit` stores the selected Axiom, Cloudflare, Neon, PlanetScale, and/or Prisma provider profiles under `~/.alchemy`; no provider-specific setup command is required by this scaffold.

Deploys are staged and default to a personal `dev_<username>` stage. For production, run the deploy with an explicit stage from `packages/infra`:

```bash
cd packages/infra && bunx alchemy deploy --stage production
```

Alchemy creates a stage-specific Axiom dataset and a least-privilege ingest token. `dev` injects the credentials into the observed apps without writing the token to an env file.
For a deployed Docker image, pass `AXIOM_API_KEY`, `AXIOM_DATASET`, and `AXIOM_EDGE_URL` through the target platform's secret manager. Local observed development runs through Alchemy with the credentials injected in memory.

### Docker Compose

- Start the full local stack: `bun run docker:up`
- Open Storefront at `http://localhost:3001`, API at
  `http://localhost:3000`, and Commerce Dashboard at
  `http://localhost:3050/dashboard/`.
- Follow all logs with `bun run docker:logs`, or use
  `docker compose logs -f commerce commerce-worker` for Commerce only.
- Stop the stack without deleting its database or asset volumes:
  `bun run docker:down`.

The root local Compose file contains development defaults. It builds one
Commerce image for its seed, server and worker, and one application image for
the web, API and migrations. Both databases and the Commerce assets use
separate named volumes. Override local values with shell environment variables
when needed; no `.env` file or Axiom credential is required. The local file
publishes ports for the browser and development tools.
If you used the former separate Commerce Compose project, back up and restore
its database and asset volumes before deleting that project; the unified
project uses new volume ownership.

Coolify staging uses the single
[staging Compose file and runbook](docs/deployment/coolify.md). It keeps
databases and one-shot jobs private. Production deployment will be designed
separately for `ocdly.com`.

## Git Hooks and Formatting

- Run checks: `bun run check`

## Project Structure

```
ocdly/
├── apps/
│   ├── web/         # Storefront (React + TanStack Start)
│   ├── server/      # Authentication and Commerce identity API (Hono)
│   └── commerce/    # Vendure server, worker and merchant dashboard
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── auth/        # Authentication configuration
│   ├── db/          # Application database schema
│   └── infra/       # Axiom observability provisioning
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
- `bun run docker:build`: Build the Docker Compose images
- `bun run docker:up`: Build and start the Docker Compose stack
- `bun run docker:logs`: Tail logs from the Docker Compose stack
- `bun run docker:down`: Stop the Docker Compose stack

## Better Auth Schema Generation

After changing auth plugins or schema options, run `bun run auth:generate` from the project root. The script runs the Better Auth CLI through `varlock run` from the owning app directory, loading the auth instance from `src/services.ts`. Review the schema changes, then use your ORM's migration workflow to apply them.
