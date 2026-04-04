#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Seeding roles (non-fatal — roles are also created on first login)..."
npx prisma db seed || echo "[entrypoint] Seed skipped (will be created on first login)"

echo "[entrypoint] Starting Next.js..."
exec node server.js
