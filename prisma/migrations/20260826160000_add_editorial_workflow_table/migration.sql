-- CreateEnum
CREATE TYPE "EditorialStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "EditorialWorkflow" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "targetType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "versions" JSONB NOT NULL,
    "reviewQueue" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EditorialWorkflow_targetType_entityId_key" ON "EditorialWorkflow"("targetType", "entityId");

-- CreateIndex
CREATE INDEX "EditorialWorkflow_entityId_idx" ON "EditorialWorkflow"("entityId");

-- CreateIndex
CREATE INDEX "EditorialWorkflow_status_idx" ON "EditorialWorkflow"("status");
