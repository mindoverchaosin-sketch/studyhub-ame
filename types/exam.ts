export type QuestionOption = string

export type QuestionType = 'mcq' | 'multiple-choice' | 'true-false'

export interface ExamQuestion {
  id: string
  prompt: string
  type: QuestionType
  topic?: string
  difficulty?: string
  options: QuestionOption[]
  correctOption?: number
  explanation?: string
}

export interface AttemptQuestion {
  id: string
  question: string
  options: QuestionOption[]
  selectedOption?: number | null
  bookmarked?: boolean
  markedForReview?: boolean
  displayOrder?: number
  answeredAt?: string | null
  // optional metadata for presentation
  topic?: string
  difficulty?: string
  type?: QuestionType
  correctOption?: number
  explanation?: string
}

export interface ExamAttempt {
  id: string
  templateId: string
  title: string
  expiresAt?: string
  durationMinutes?: number
  questions: AttemptQuestion[]
}

export type StudentAnswer = { attemptQuestionId: string; selectedOption: number | null }

export type ReviewState = Record<string, boolean>

export interface ExamResult {
  score: number
  percentage: number
  passed: boolean
  timeTakenMs: number
}

export interface TopicPerformance {
  topic: string
  accuracy: number
}

export type PerformanceHistory = Array<{
  id: string
  title: string
  date: string
  score: number
  percentage: number
  durationMinutes: number
  passed: boolean
}>

export interface TimerState {
  remainingMs: number
  isExpired: boolean
}
