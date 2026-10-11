ALTER TABLE "Module"
ADD COLUMN "canonicalQuizId" TEXT;

CREATE UNIQUE INDEX "Module_canonicalQuizId_key"
ON "Module"("canonicalQuizId");

ALTER TABLE "Module"
ADD CONSTRAINT "Module_canonicalQuizId_fkey"
FOREIGN KEY ("canonicalQuizId") REFERENCES "Quiz"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
