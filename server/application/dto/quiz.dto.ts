import type { QuestionBankReferenceDTO } from './question-bank.dto'
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
  questionBanks: QuestionBankReferenceDTO[]
  questions?: QuestionDTO[]
  topicId: string
  lessonId?: string
}

export type QuizAttemptReviewItemDTO = {
  id: string
  question: string
  selectedAnswer: string | null
  correctAnswer: string | null
  explanation: string | null
  isCorrect: boolean
  isSkipped: boolean
  isMarkedForReview: boolean
  isBookmarked: boolean
}

export type QuizAttemptWeakTopicDTO = {
  id: string
  title: string
  reason: string
}

export type QuizAttemptResultDTO = {
  score: number
  correct: number
  incorrect: number
  passed: boolean
  accuracy: number
  durationMinutes: number
  mode: "practice" | "mock"
  timedOut: boolean
  review: QuizAttemptReviewItemDTO[]
  weakTopics: QuizAttemptWeakTopicDTO[]
  analytics: QuizAnalyticsDTO
}

export type QuizAnalyticsDTO = {
  bestScore: number
  averageScore: number
  completionPercent: number
  recentAttempts: Array<{
    id: string
    score: number
    passed: boolean
    attemptedAt: Date
    quizTitle: string
  }>
}
