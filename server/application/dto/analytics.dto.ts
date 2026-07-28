export type StudentAnalyticsDTO = {
  totalStudents: number
  newRegistrations: number
  activeStudents: number
  registrationTrend?: Array<{ date: string; count: number }> | null
}

export type LearningAnalyticsDTO = {
  moduleCompletionRate: number
  resourceUsageCount: number
  mostStudiedModules: Array<{ moduleId: string; moduleName: string; usageCount: number }>
}

export type QuestionBankAnalyticsDTO = {
  totalQuestions: number
  byDifficulty: { BEGINNER: number; INTERMEDIATE: number; ADVANCED: number }
  byModule: Array<{ moduleId: string; moduleName: string; count: number }>
  recentlyAdded: Array<{ questionId: string; prompt: string; difficulty: string; addedAt: string }>
}

export type MockExamAnalyticsDTO = {
  totalAttempts: number
  averageScore: number | null
  passRate: number
  completionRate: number
}

export type PublishingAnalyticsDTO = {
  draftCount: number
  publishedCount: number
  archivedCount: number
  byEntityType: Record<'MODULE' | 'RESOURCE' | 'QUESTION', { draft: number; published: number; archived: number }>
}

export type AnalyticsTrendDTO = {
  date: string
  value: number
}

export type EnterpriseAnalyticsDashboardDTO = {
  students: StudentAnalyticsDTO
  learning: LearningAnalyticsDTO
  questionBank: QuestionBankAnalyticsDTO
  mockExams: MockExamAnalyticsDTO
  publishing: PublishingAnalyticsDTO
  trends?: {
    dailyRegistrations?: AnalyticsTrendDTO[] | null
    dailyExamAttempts?: AnalyticsTrendDTO[] | null
    dailyStudySessions?: AnalyticsTrendDTO[] | null
  }
  generatedAt: string
}
