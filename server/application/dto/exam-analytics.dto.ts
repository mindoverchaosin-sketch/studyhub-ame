export type ExamAnalyticsDTO = {
  attemptId: string
  examTitle: string
  score: number
  percentage: number
  passed: boolean
  passingScore: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  timeTakenSeconds: number | null
  topicAnalytics: TopicAnalyticsDTO
  difficultyAnalytics: DifficultyAnalyticsDTO
  timeAnalytics: TimeAnalyticsDTO
  readiness: ReadinessDTO
  recommendations: string[]
}

export type TopicAnalyticsDTO = {
  perTopic: Array<{ title: string; correct: number; incorrect: number; unanswered: number; accuracy: number }>
  perModule: Array<{ title: string; correct: number; incorrect: number; unanswered: number; accuracy: number }>
  strongTopics: string[]
  weakTopics: string[]
  mostMissedConcepts: Array<{ concept: string; misses: number }>
}

export type DifficultyAnalyticsDTO = {
  easy: DifficultyBucketDTO
  medium: DifficultyBucketDTO
  hard: DifficultyBucketDTO
}

export type DifficultyBucketDTO = {
  label: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  attempted: number
  correct: number
  incorrect: number
  unanswered: number
  accuracy: number
}

export type TimeAnalyticsDTO = {
  averageSecondsPerQuestion: number
  fastestQuestions: Array<{ id: string; prompt: string; seconds: number }>
  slowestQuestions: Array<{ id: string; prompt: string; seconds: number }>
  distribution: Array<{ label: string; count: number; range: string }>
}

export type ReadinessDTO = {
  readinessPercentage: number
  confidence: 'Low' | 'Moderate' | 'High'
  nextActions: string[]
  recentExamScore: number
  adaptiveAccuracy: number
  topicMastery: number
  revisionCompletion: number
}

export type ExamHistoryDTO = {
  attemptId: string
  date: string
  score: number
  percentage: number
  passed: boolean
  durationSeconds: number | null
  trend: 'up' | 'down' | 'flat'
}
