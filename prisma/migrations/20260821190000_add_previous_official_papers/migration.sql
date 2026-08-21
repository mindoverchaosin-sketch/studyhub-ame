-- CreateTable
CREATE TABLE "PreviousOfficialPaper" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "paperType" TEXT NOT NULL,
    "mediaPath" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PreviousOfficialPaper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreviousOfficialPaper_courseId_idx" ON "PreviousOfficialPaper"("courseId");
CREATE INDEX "PreviousOfficialPaper_moduleId_idx" ON "PreviousOfficialPaper"("moduleId");
CREATE INDEX "PreviousOfficialPaper_year_idx" ON "PreviousOfficialPaper"("year");
CREATE INDEX "PreviousOfficialPaper_status_idx" ON "PreviousOfficialPaper"("status");
CREATE INDEX "PreviousOfficialPaper_isPremium_idx" ON "PreviousOfficialPaper"("isPremium");

-- AddForeignKey
ALTER TABLE "PreviousOfficialPaper" ADD CONSTRAINT "PreviousOfficialPaper_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreviousOfficialPaper" ADD CONSTRAINT "PreviousOfficialPaper_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;