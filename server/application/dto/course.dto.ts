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
  _count?: {
    modules: number
  }
}
