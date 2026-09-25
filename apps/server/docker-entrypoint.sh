#!/bin/sh

set -eu

database_password="${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}"
export DATABASE_URL="postgresql://postgres:${database_password}@postgres:5432/ocdly"

if [ -n "${SERVICE_URL_SERVER:-}" ]; then
	export BETTER_AUTH_URL="${SERVICE_URL_SERVER}"
fi

if [ -n "${SERVICE_URL_WEB:-}" ]; then
	export CORS_ORIGIN="${SERVICE_URL_WEB}"
fi

exec "$@"
