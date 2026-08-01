import type { AttemptQuestion } from '@/types/exam'

export type ExamAttemptQuestionDTO = AttemptQuestion

export type ExamAttemptDTO = {
  id: string
  studentId: string
  templateId: string
  title: string
  status: string
  startedAt?: string | null
  submittedAt?: string | null
  expiresAt?: string
  score?: number | null
  percentage?: number | null
  passed?: boolean | null
  questions: ExamAttemptQuestionDTO[]
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
