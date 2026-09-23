-- Add independent current-state tracking for student Question Bank practice
CREATE TABLE "StudentQuestionState" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOption" INTEGER,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentQuestionState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentQuestionState_studentId_questionId_key" ON "StudentQuestionState"("studentId", "questionId");
CREATE INDEX "StudentQuestionState_studentId_idx" ON "StudentQuestionState"("studentId");
CREATE INDEX "StudentQuestionState_questionId_idx" ON "StudentQuestionState"("questionId");
CREATE INDEX "StudentQuestionState_studentId_answeredAt_idx" ON "StudentQuestionState"("studentId", "answeredAt");

ALTER TABLE "StudentQuestionState" ADD CONSTRAINT "StudentQuestionState_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentQuestionState" ADD CONSTRAINT "StudentQuestionState_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
