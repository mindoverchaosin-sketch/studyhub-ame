export type ModuleExamType = 'DGCA' | 'EASA' | 'BOTH'
export type ModuleDirectoryStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'ALL'
export type ModuleDirectorySort = 'updated' | 'title' | 'created'

export type ModuleDirectoryFilters = {
  search?: string
  examType?: ModuleExamType | 'ALL'
  status?: ModuleDirectoryStatus
  sortBy?: ModuleDirectorySort
  page?: number
  pageSize?: number
}

export type ModuleDirectoryItemDTO = {
  id: string
  title: string
  slug: string
  moduleNumber: string
  examType: ModuleExamType
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  description: string
  updatedAt: string
  createdAt: string
  lessonCount: number
  resourceCount: number
}

export type ModuleDirectoryPaginationDTO = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type ModuleDirectorySummaryDTO = {
  totalCount: number
  publishedCount: number
  draftCount: number
  archivedCount: number
}

export type ModuleDirectoryDTO = {
  items: ModuleDirectoryItemDTO[]
  pagination: ModuleDirectoryPaginationDTO
  summary: ModuleDirectorySummaryDTO
}

export type ModuleDetailDTO = {
  id: string
  title: string
  slug: string
  moduleNumber: string
  description: string
  examType: ModuleExamType
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedHours: number
  displayOrder: number
  updatedAt: string
  createdAt: string
  publishedAt: string | null
  lessons: Array<{ id: string; title: string; displayOrder: number; status: string }>
  resources: Array<{ id: string; title: string; type: string; status: string; displayOrder: number }>
}

export type ModuleManagementActionResult = {
  id: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
}
