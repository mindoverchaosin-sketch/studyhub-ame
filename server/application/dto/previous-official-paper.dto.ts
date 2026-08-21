export type PreviousOfficialPaperDTO = {
  id: string
  courseId: string
  moduleId: string
  courseTitle: string
  moduleTitle: string
  year: number
  title: string
  paperType: string
  mediaPath: string
  isPremium: boolean
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type StudentPreviousOfficialPaperDTO = Omit<PreviousOfficialPaperDTO, 'mediaPath' | 'status' | 'publishedAt' | 'createdAt' | 'updatedAt'>
