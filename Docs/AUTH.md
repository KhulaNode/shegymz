# Authentication & Identity

This document covers the auth stack: NextAuth v4, Google SSO, and username/password credentials.

---

## Stack overview

| Component | Role |
|---|---|
| **NextAuth v4** | Authentication framework — handles sessions, providers, JWT |
| **Google OAuth** | Social sign-in via Google |
| **bcryptjs** | Password hashing (cost factor 12) |
| **Prisma** | Persists `User`, `Account`, `UserRole` records |
| **JWT sessions** | No sessions table — tokens stored in signed cookies |

---

## Role assignment

All new users (Google or credentials) are automatically assigned the **CLIENT** role on first sign-up/login. This is enforced in `src/lib/auth.ts` via `ensureClientRole()` which runs on every successful sign-in.

To promote a user to `ADMIN` or `TRAINER`, change their role directly in Metabase (`user_role_view` or the `UserRole` table).

There is **no public signup path** for `ADMIN` or `TRAINER`.

---

## Login flows

### Google SSO

1. User clicks "Continue with Google" on `/login`.
2. NextAuth redirects to Google OAuth consent screen.
3. On callback, NextAuth calls the `signIn` callback in `src/lib/auth.ts`.
4. The callback finds or creates a `User` row and creates/upserts an `Account` row with `provider = 'google'`.
5. If this is the user's first login, the `CLIENT` role is assigned.
6. `lastLoginAt` is updated.
7. A signed JWT cookie is set and the user is redirected to `/`.

### Username / Password

**Sign in:**
1. User submits email + password on `/login` (Sign In tab).
2. NextAuth calls the `CredentialsProvider.authorize()` function.
3. User is looked up by email; bcrypt verifies the password.
4. On success, `signIn` callback assigns CLIENT role (if missing) and updates `lastLoginAt`.

**Create account:**
1. User submits full name + email + password on `/login` (Create Account tab).
2. The form POSTs to `POST /api/auth/register`.
3. The endpoint creates a `User`, hashes the password (bcrypt cost factor 12), creates a `credentials` Account record, and assigns the `CLIENT` role.
4. On success, the form automatically calls `signIn('credentials', ...)` to log the user in.

---

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a project (or select an existing one).
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
4. Application type: **Web application**.
5. Add Authorised redirect URI:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://shegymz.com/api/auth/callback/google`
6. Copy the **Client ID** and **Client Secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

---

## Required environment variables

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Random string used to sign JWT cookies. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public base URL of the app (e.g. `https://shegymz.com`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

---

## DB schema

### `User`

| Column | Type | Notes |
|---|---|---|
| `id` | cuid | Primary key |
| `email` | text unique NOT NULL | Required for all users |
| `username` | text unique | Optional, unused by auth currently |
| `passwordHash` | text | NULL for Google-only users |
| `fullName` | text | Optional display name |
| `imageUrl` | text | Google profile picture |
| `isActive` | boolean | Defaults true |
| `emailVerifiedAt` | timestamp | Set when email is verified (future) |
| `lastLoginAt` | timestamp | Updated on every successful sign-in |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `Account`

| Column | Type | Notes |
|---|---|---|
| `id` | cuid | |
| `userId` | text | FK → User |
| `provider` | text | `"google"` or `"credentials"` |
| `providerAccountId` | text | Google subject ID, or userId for credentials |

Unique constraint: `(provider, providerAccountId)`.

---

## Audit views in Metabase

Two read-only SQL views are created by the `add_auth` migration:

### `user_role_view`
One row per user per role. Useful for quickly seeing role assignments.

```sql
SELECT * FROM user_role_view;
```

### `user_roles_summary`
One row per user with all roles concatenated into a string.

```sql
SELECT * FROM user_roles_summary;
```

In Metabase, these appear as tables after Admin → Databases → Sync.

---

## Relevant files

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | NextAuth config — providers, callbacks, JWT logic |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `src/app/api/auth/register/route.ts` | Public registration endpoint |
| `src/app/login/page.tsx` | Login / sign-up UI |
| `src/components/Providers.tsx` | SessionProvider wrapper |
| `src/types/next-auth.d.ts` | Session type extensions |
| `prisma/migrations/20260411120000_add_auth/` | DB migration for auth schema |
