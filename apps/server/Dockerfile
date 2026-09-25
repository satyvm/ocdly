FROM oven/bun:1.4.2 AS builder
WORKDIR /app

COPY . .
RUN --mount=type=cache,target=/root/.bun/install/cache NODE_ENV=development bun install --frozen-lockfile

ARG PUBLIC_API_URL
ENV VITE_SERVER_URL=${PUBLIC_API_URL}
ENV NODE_ENV=production
RUN cd apps/server && bun run build
RUN cd apps/web && bun run build

FROM oven/bun:1.4.2 AS runner
WORKDIR /app
ARG PUBLIC_API_URL
ENV VITE_SERVER_URL=${PUBLIC_API_URL}
ENV NODE_ENV=production
COPY --from=builder /app /app

EXPOSE 3000 3001

WORKDIR /app/apps/server
CMD ["bun", "dist/index.mjs"]
