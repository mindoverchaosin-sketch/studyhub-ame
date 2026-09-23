-- Make legacy resource URLs optional for document-only materials.
ALTER TABLE "StudyMaterial"
  ALTER COLUMN "url" DROP NOT NULL;

-- Add document metadata without a sourceType default that could misclassify legacy rows.
ALTER TABLE "StudyMaterial"
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "documentContent" JSONB,
  ADD COLUMN "documentVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lastReviewedAt" TIMESTAMP(3),
  ADD COLUMN "lastPublishedAt" TIMESTAMP(3);

-- Existing files remain legacy resources and retain all existing URL/status/access data.
UPDATE "StudyMaterial"
SET "sourceType" = 'LEGACY_RESOURCE'
WHERE "sourceType" IS NULL;

ALTER TABLE "StudyMaterial"
  ALTER COLUMN "sourceType" SET NOT NULL;

CREATE INDEX "StudyMaterial_sourceType_idx"
  ON "StudyMaterial"("sourceType");
