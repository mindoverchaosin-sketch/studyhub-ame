export type ResourceDTO = {
  id: string
  moduleId?: string | null
  lessonId?: string | null
  title: string
  description: string | null
  type: string
  url: string
  isPremium: boolean
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
