export type ExamAttemptQuestionDTO = {
  id: string
  questionId: string
  displayOrder: number
}

export type ExamAttemptDTO = {
  id: string
  studentId: string
  templateId: string
  status: string
  startedAt?: string | null
  submittedAt?: string | null
  expiresAt?: string | null
  score?: number | null
  percentage?: number | null
  passed?: boolean | null
  questions?: ExamAttemptQuestionDTO[]
  createdAt: string
  updatedAt: string
}

export type ExamAttemptResultDTO = ExamAttemptDTO & {
  templateName: string
  totalQuestions: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  timeTakenSeconds: number | null
}
