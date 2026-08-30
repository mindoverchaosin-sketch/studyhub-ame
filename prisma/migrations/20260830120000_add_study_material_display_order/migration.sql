-- Add displayOrder to StudyMaterial for persistent resource ordering
-- Per-module ordering: resources within the same module can be reordered

ALTER TABLE "StudyMaterial" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "StudyMaterial_moduleId_displayOrder_idx" ON "StudyMaterial"("moduleId", "displayOrder");
