#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy

echo "[entrypoint] Seeding roles..."
npx prisma db seed

echo "[entrypoint] Starting Next.js..."
exec node server.js
