-- Add durable provider identifiers without removing existing billing data.
ALTER TABLE "Subscription"
  ADD COLUMN "providerSubscriptionId" TEXT;

ALTER TABLE "Invoice"
  ADD COLUMN "providerEventId" TEXT,
  ADD COLUMN "providerPaymentId" TEXT;

CREATE INDEX "Subscription_providerSubscriptionId_idx"
  ON "Subscription"("providerSubscriptionId");

CREATE UNIQUE INDEX "Invoice_providerPaymentId_key"
  ON "Invoice"("providerPaymentId");

CREATE INDEX "Invoice_providerEventId_idx"
  ON "Invoice"("providerEventId");

CREATE TYPE "BillingWebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

CREATE TABLE "BillingWebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "providerSubscriptionId" TEXT,
  "processingStatus" "BillingWebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingWebhookEvent_provider_providerEventId_key"
  ON "BillingWebhookEvent"("provider", "providerEventId");

CREATE INDEX "BillingWebhookEvent_providerPaymentId_idx"
  ON "BillingWebhookEvent"("providerPaymentId");

CREATE INDEX "BillingWebhookEvent_providerSubscriptionId_idx"
  ON "BillingWebhookEvent"("providerSubscriptionId");

CREATE INDEX "BillingWebhookEvent_processingStatus_idx"
  ON "BillingWebhookEvent"("processingStatus");

-- Preserve all rows; refuse migration when existing data cannot satisfy the
-- one-active-subscription invariant instead of silently deleting records.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Subscription"
    WHERE "status" = 'ACTIVE'
      AND "deletedAt" IS NULL
    GROUP BY "userId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create one-active-subscription index: duplicate active subscriptions exist';
  END IF;
END $$;

CREATE UNIQUE INDEX "Subscription_one_active_per_user_key"
  ON "Subscription"("userId")
  WHERE "status" = 'ACTIVE' AND "deletedAt" IS NULL;
