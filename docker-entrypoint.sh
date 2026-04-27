#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Seeding baseline roles (safe to run multiple times)..."
npx prisma db seed || echo "[entrypoint] Seed skipped or failed non-fatally"

echo "[entrypoint] Starting Next.js..."
exec node server.js
