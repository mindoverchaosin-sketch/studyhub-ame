export type ResourceDTO = {
  id: string
  moduleId?: string | null
  lessonId?: string | null
  moduleTitle?: string | null
  courseTitle?: string | null
  title: string
  description: string | null
  type: string
  url: string
  isPremium: boolean
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED" | "IN_REVIEW"
  editorialStatus?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED"
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
