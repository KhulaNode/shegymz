-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_auth
-- Extends the User model and adds the Account model to support NextAuth.
-- Also creates read-only audit views for Metabase inspection.
-- ─────────────────────────────────────────────────────────────────────────────

-- AlterTable: rename name → fullName (preserves any existing data)
ALTER TABLE "User" RENAME COLUMN "name" TO "fullName";

-- AlterTable: add emailVerifiedAt
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- AlterTable: make email required
-- Safe: no User rows exist yet (only Role/UserRole rows from seed)
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- CreateTable: Account (one row per provider per user)
CREATE TABLE "Account" (
    "id"                TEXT         NOT NULL,
    "userId"            TEXT         NOT NULL,
    "provider"          TEXT         NOT NULL,
    "providerAccountId" TEXT         NOT NULL,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique (provider, providerAccountId)
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
    ON "Account"("provider", "providerAccountId");

-- AddForeignKey: Account.userId → User.id
ALTER TABLE "Account"
    ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit views for Metabase
-- ─────────────────────────────────────────────────────────────────────────────

-- View: user_role_view
-- One row per user per role. Use this to inspect individual role assignments.
CREATE VIEW "user_role_view" AS
SELECT
    u."id"          AS "userId",
    u."email",
    u."fullName",
    u."username",
    u."isActive",
    u."createdAt",
    u."lastLoginAt",
    r."code"        AS "roleCode",
    r."description" AS "roleDescription"
FROM "User" u
JOIN "UserRole" ur ON ur."userId" = u."id"
JOIN "Role"     r  ON r."id"     = ur."roleId";

-- View: user_roles_summary
-- One row per user with all roles concatenated. Use for a quick user overview.
CREATE VIEW "user_roles_summary" AS
SELECT
    u."id"         AS "userId",
    u."email",
    u."fullName",
    u."isActive",
    u."lastLoginAt",
    STRING_AGG(r."code", ', ' ORDER BY r."code") AS "roles"
FROM "User" u
LEFT JOIN "UserRole" ur ON ur."userId" = u."id"
LEFT JOIN "Role"     r  ON r."id"     = ur."roleId"
GROUP BY u."id", u."email", u."fullName", u."isActive", u."lastLoginAt";
