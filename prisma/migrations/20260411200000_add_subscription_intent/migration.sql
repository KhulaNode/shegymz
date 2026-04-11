-- CreateEnum
CREATE TYPE "SubscriptionIntentStatus" AS ENUM ('PENDING_PAYMENT', 'OPTED_OUT_UNPAID_REMINDERS', 'PAID_ACCOUNT_PENDING', 'ACCOUNT_CREATED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "SubscriptionIntent" (
    "id"                       TEXT                         NOT NULL,
    "email"                    TEXT                         NOT NULL,
    "fullName"                 TEXT                         NOT NULL,
    "phone"                    TEXT,
    "planCode"                 TEXT                         NOT NULL DEFAULT 'monthly',
    "status"                   "SubscriptionIntentStatus"   NOT NULL DEFAULT 'PENDING_PAYMENT',
    "yocoCheckoutId"           TEXT,
    "yocoPaymentId"            TEXT,
    "paymentUrl"               TEXT,
    "providerReference"        TEXT,
    "userId"                   TEXT,
    "activationTokenHash"      TEXT,
    "activationTokenExpiresAt" TIMESTAMP(3),
    "activationUsedAt"         TIMESTAMP(3),
    "paymentReminderSentAt"    TIMESTAMP(3),
    "paymentReminderCount"     INTEGER                      NOT NULL DEFAULT 0,
    "activationReminderSentAt" TIMESTAMP(3),
    "activationReminderCount"  INTEGER                      NOT NULL DEFAULT 0,
    "optedOutAt"               TIMESTAMP(3),
    "nextReminderAt"           TIMESTAMP(3),
    "createdAt"                TIMESTAMP(3)                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                TIMESTAMP(3)                 NOT NULL,

    CONSTRAINT "SubscriptionIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id"                TEXT                  NOT NULL,
    "userId"            TEXT                  NOT NULL,
    "status"            "SubscriptionStatus"  NOT NULL DEFAULT 'ACTIVE',
    "provider"          TEXT                  NOT NULL DEFAULT 'yoco',
    "providerReference" TEXT,
    "startedAt"         TIMESTAMP(3),
    "endsAt"            TIMESTAMP(3),
    "intentId"          TEXT,
    "createdAt"         TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)          NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique — partial, allows multiple NULLs in Postgres)
CREATE UNIQUE INDEX "SubscriptionIntent_activationTokenHash_key" ON "SubscriptionIntent"("activationTokenHash");

-- CreateIndex
CREATE INDEX "SubscriptionIntent_email_idx"          ON "SubscriptionIntent"("email");
CREATE INDEX "SubscriptionIntent_status_idx"         ON "SubscriptionIntent"("status");
CREATE INDEX "SubscriptionIntent_nextReminderAt_idx" ON "SubscriptionIntent"("nextReminderAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_intentId_key" ON "Subscription"("intentId");
CREATE INDEX "Subscription_userId_idx"          ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "SubscriptionIntent"
    ADD CONSTRAINT "SubscriptionIntent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_intentId_fkey"
    FOREIGN KEY ("intentId") REFERENCES "SubscriptionIntent"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Metabase view: subscription overview ─────────────────────────────────────
CREATE OR REPLACE VIEW "subscription_overview" AS
SELECT
    u.id           AS user_id,
    u.email,
    u."fullName",
    s.id           AS subscription_id,
    s.status       AS subscription_status,
    s."startedAt",
    s."endsAt",
    s.provider,
    s."providerReference",
    si.id          AS intent_id,
    si."planCode",
    si.status      AS intent_status,
    si."createdAt" AS intent_created_at,
    si.phone       AS intent_phone
FROM "User" u
LEFT JOIN "Subscription"       s  ON s."userId"   = u.id
LEFT JOIN "SubscriptionIntent" si ON si."userId"   = u.id
ORDER BY u.email;
