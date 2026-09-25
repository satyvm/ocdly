FROM oven/bun:1.4.2 AS bun

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache NODE_ENV=development bun install --frozen-lockfile
RUN bun run --cwd apps/commerce build

FROM node:22-bookworm-slim AS runner
WORKDIR /app/apps/commerce
ENV NODE_ENV=production
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/commerce /app/apps/commerce
EXPOSE 3050
CMD ["node", "./dist/index.js"]
