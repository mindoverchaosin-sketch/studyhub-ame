ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';

ALTER TABLE "Subscription"
  ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "scheduledPlanId" TEXT,
  ADD COLUMN "scheduledPlanEffectiveAt" TIMESTAMP(3),
  ADD COLUMN "pastDueAt" TIMESTAMP(3),
  ADD COLUMN "gracePeriodEndsAt" TIMESTAMP(3),
  ADD COLUMN "lastPaymentAttemptAt" TIMESTAMP(3),
  ADD COLUMN "retryAttemptCount" INTEGER NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "Subscription_providerSubscriptionId_idx";
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key"
  ON "Subscription"("providerSubscriptionId");

CREATE INDEX "Subscription_scheduledPlanEffectiveAt_idx"
  ON "Subscription"("scheduledPlanEffectiveAt");
CREATE INDEX "Subscription_gracePeriodEndsAt_idx"
  ON "Subscription"("gracePeriodEndsAt");
