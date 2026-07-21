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
