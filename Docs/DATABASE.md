# Database Foundation

This document covers the database stack: PostgreSQL, Prisma ORM, and NocoDB.

---

## Stack overview

| Component | Role |
|---|---|
| **PostgreSQL 16** | Primary application database — internal only, no public port |
| **Prisma 5** | ORM, migration runner, schema source-of-truth |
| **metabase-postgres** | Dedicated postgres for Metabase’s internal state — never touches app data |
| **Metabase** | Admin / analytics UI — runs in-stack, available at `http://host:${METABASE_PORT:-3001}` |

---

## Environment variables

Copy `.env.example` to `.env.local` and set at minimum:

```env
DATABASE_URL=postgresql://shegymz:your_password@localhost:5432/shegymzdb
POSTGRES_DB=shegymzdb
POSTGRES_USER=shegymz
POSTGRES_PASSWORD=your_password
```

---

## 1. Start the DB stack

```bash
# Start PostgreSQL and NocoDB (detached)
docker compose up postgres nocodb -d

# Check both are healthy
docker compose ps
```

PostgreSQL will be available at `localhost:5432`.
NocoDB will be available at `http://localhost:8080` (or whatever `NOCODB_PORT` is set to).

---

## 2. Run Prisma migrations

**Development** (creates migration files and applies them):
```bash
npx prisma migrate dev
```

**Production / CI** (applies existing migration files only):
```bash
npx prisma migrate deploy
```

The container entrypoint (`docker-entrypoint.sh`) automatically runs `prisma migrate deploy` on every container start.

---

## 3. Run the seed

The seed inserts the three baseline roles (`ADMIN`, `TRAINER`, `CLIENT`). It is safe to run multiple times — it uses `upsert`.

```bash
npx prisma db seed
```

Or directly:
```bash
npx ts-node --project tsconfig.scripts.json prisma/seed.ts
```

The container entrypoint also runs this automatically after migrations.

---

## 4. Access Metabase

Metabase runs in the stack with its **own dedicated postgres** (`metabase-postgres`) for its internal state. The application database is never touched by Metabase's migrations.

Once `docker compose up -d` completes, open:
```
http://localhost:3001
```

### First-time setup

1. Complete the Metabase setup wizard (create admin account).
2. When asked to add a database, skip it — you’ll add it manually after.
3. Go to **Settings → Admin → Databases → Add Database → PostgreSQL**:

| Field | Value |
|---|---|
| Host | `postgres` |
| Port | `5432` |
| Database name | `shegymzdb` |
| Username | `shegymz` |
| Password | your `POSTGRES_PASSWORD` |

Click **Save**. Metabase will sync and the `User`, `Role`, and `UserRole` tables will appear.

---

## Schema

Located at `prisma/schema.prisma`.

| Model | Key fields |
|---|---|
| `User` | `id`, `email`, `username`, `passwordHash`, `name`, `imageUrl`, `isActive`, timestamps |
| `Role` | `id`, `code` (unique: ADMIN/TRAINER/CLIENT), `description` |
| `UserRole` | `userId`, `roleId` — many-to-many join, unique constraint on both |

---

## Adding new migrations

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_your_change`
3. Commit the generated files in `prisma/migrations/`
