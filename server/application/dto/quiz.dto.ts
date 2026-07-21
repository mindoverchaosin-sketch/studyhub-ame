import type { QuestionBankDTO } from './question-bank.dto'
import type { QuestionDTO } from './question.dto'

export type QuizDTO = {
  id: string
  moduleId: string
  title: string
  description: string | null
  passingScore: number
  timeLimitMinutes: number | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  questionBanks?: QuestionBankDTO[]
  questions?: QuestionDTO[]
  topicId: string
  lessonId?: string
}
