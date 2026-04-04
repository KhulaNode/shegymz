# Auth Foundation — SheGymZ

This document covers the authentication and user-role system added in the
`feat/auth-foundation` branch. The existing Yoco payment flow is **unchanged**.

---

## Stack

| Concern        | Technology                                    |
|----------------|-----------------------------------------------|
| Database       | SQLite via Prisma 5 (swap URL for Postgres later) |
| ORM            | Prisma                                        |
| Auth framework | NextAuth v4 (next-auth)                       |
| Password hash  | bcryptjs (cost factor 12)                     |
| Session        | JWT (no server-side session store required)   |

---

## Database schema

```
User          — id, email, username, passwordHash, name, imageUrl,
                isActive, createdAt, updatedAt, lastLoginAt,
                emailVerified, image (NextAuth compat)
Account       — OAuth provider accounts linked to a User
Session       — active sessions (used by NextAuth adapter)
VerificationToken — email verification tokens
Role          — id, code (ADMIN | TRAINER | CLIENT), description
UserRole      — userId + roleId (many-to-many join)
```

---

## Running the first-time setup

```bash
# 1. Copy env template
cp .env.example .env.local
# Fill in AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

# 2. Create the SQLite database and apply migrations
npx prisma migrate dev

# 3. Seed the three standard Role rows (idempotent)
npx prisma db seed
```

### Subsequent deploys / CI

```bash
npx prisma migrate deploy   # applies pending migrations (non-interactive)
npx prisma db seed          # idempotent — safe to run every deploy
```

---

## How to create username/password accounts

Use the included CLI script (never store plain-text passwords):

```bash
# Create a user with both email and username
npx ts-node --project tsconfig.scripts.json scripts/create-user.ts \
  --email alice@example.com \
  --username alice \
  --password "ChangeMe123!" \
  --name "Alice Smith"

# Email-only user
npx ts-node --project tsconfig.scripts.json scripts/create-user.ts \
  --email alice@example.com \
  --password "ChangeMe123!"

# Username-only user (e.g. no email)
npx ts-node --project tsconfig.scripts.json scripts/create-user.ts \
  --username trainerBob \
  --password "ChangeMe123!"
```

Users created this way will get the `CLIENT` role assigned automatically on
first login (same as all other new users).

---

## How to log in with Google

1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`.
2. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create an **OAuth 2.0 Client ID** (Web application).
   - Add authorised redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://shegymz.com/api/auth/callback/google` (prod)
3. Navigate to `/login` and click **Continue with Google**.

---

## How to log in with username/password

1. Create a user via the CLI script above.
2. Navigate to `/login`.
3. Enter the email **or** username and the password.
4. Submit — you will be redirected to `/` on success.

---

## Admin bootstrap

Set `ADMIN_BOOTSTRAP_EMAIL` in your `.env.local`:

```
ADMIN_BOOTSTRAP_EMAIL=admin@shegymz.com
```

**Behaviour**: on every successful sign-in, `src/lib/auth.ts` checks whether
the signed-in user's email matches `ADMIN_BOOTSTRAP_EMAIL`. If it does, the
`ADMIN` role is upserted for that user (idempotent — safe to run repeatedly).

> **Note**: The user must still sign in via Google **or** have a credentials
> account created for them first. The bootstrap only assigns the role — it does
> not create the account.

---

## On first successful login

Regardless of provider:

1. `lastLoginAt` is updated on the `User` row.
2. If the user has **no roles** yet, the `CLIENT` role is assigned.
3. If `ADMIN_BOOTSTRAP_EMAIL` matches, the `ADMIN` role is also assigned.
4. Roles are embedded in the JWT and exposed on `session.user.roles` (string[]).

---

## Payment flow compatibility

The Yoco payment routes (`/api/subscribe`, `/api/webhook/yoco`,
`/api/payment/status`) are **not guarded by auth**. They remain fully public
and work exactly as they did on `yoco-branch`. No payment code was modified.

---

## Manual test checklist

### App still runs
```bash
npm run dev
# Open http://localhost:3000 — landing page loads
# Open http://localhost:3000/subscribe — payment form loads
```

### Payment flow still works
```bash
# POST to /api/subscribe with { name, email, phone }
# Should return { redirectUrl, ref } pointing to Yoco hosted checkout
curl -s -X POST http://localhost:3000/api/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","phone":"0821234567"}' \
  | jq .
```

### Google login works
1. `npm run dev`
2. Open `http://localhost:3000/login`
3. Click **Continue with Google** — completes OAuth and redirects to `/`
4. Check SQLite DB: `npx prisma studio` → User table should have a new row

### Username/password login works
```bash
# Create a test user
npx ts-node --project tsconfig.scripts.json scripts/create-user.ts \
  --email test@example.com --password "Test1234!"

# Sign in via /login with email=test@example.com and password Test1234!
```

### First login creates user + assigns CLIENT role
```bash
# After any login, open Prisma Studio
npx prisma studio
# Check: User table has the new user
# Check: UserRole table has a row linking that user to CLIENT role
```

### Bootstrap admin email gets ADMIN role
```bash
# Ensure ADMIN_BOOTSTRAP_EMAIL=admin@shegymz.com in .env.local
# Sign in with that exact email (Google or credentials)
# Check UserRole table — user should have both CLIENT and ADMIN roles
```
