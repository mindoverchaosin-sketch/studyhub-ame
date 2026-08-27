import type { LessonDTO } from './lesson.dto'

export type ModuleDTO = {
  id: string
  courseId: string
  slug: string
  title: string
  moduleNumber: string
  description: string | null
  isPremium: boolean
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  estimatedHours: number
  displayOrder: number
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED" | "IN_REVIEW"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type ModuleWithSectionsDTO = ModuleDTO & {
  sections: Array<LessonDTO & { order: number; isPublished: boolean }>
}
