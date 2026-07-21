export type CourseDTO = {
  id: string
  slug: string
  title: string
  description: string | null
  categoryId: string | null
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ModuleDTO = {
  id: string
  courseId: string
  slug: string
  title: string
  moduleNumber: string
  description: string | null
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  estimatedHours: number
  displayOrder: number
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type LessonDTO = {
  id: string
  moduleId: string
  slug: string
  title: string
  description: string | null
  durationMinutes: number
  displayOrder: number
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type TopicDTO = LessonDTO & {
  estimatedMinutes?: number | null
  difficulty?: string
}

export type ResourceDTO = {
  id: string
  moduleId?: string | null
  lessonId?: string | null
  title: string
  description?: string | null
  type: string
  url: string
  isPremium: boolean
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type QuestionDTO = {
  id: string
  questionBankId: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer?: string | null
  explanation?: string | null
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
}

export type QuestionBankDTO = {
  id: string
  title: string
  description: string | null
}

export type QuizDTO = {
  id: string
  moduleId: string
  topicId?: string
  lessonId?: string
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
}
