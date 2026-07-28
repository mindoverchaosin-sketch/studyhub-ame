export type StudentStatus = 'ACTIVE' | 'SUSPENDED'

export type StudentDirectoryFilters = {
  search?: string
  status?: 'ACTIVE' | 'SUSPENDED' | 'ALL'
  role?: 'STUDENT' | 'ALL'
  page?: number
  pageSize?: number
  sortBy?: 'newest' | 'lastActive' | 'name'
}

export type StudentDirectoryItemDTO = {
  id: string
  email: string
  fullName: string
  displayName?: string | null
  status: StudentStatus
  createdAt: string
  lastActiveAt: string
  role: 'STUDENT'
}

export type StudentDirectoryPaginationDTO = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type StudentDirectorySummaryDTO = {
  totalCount: number
  activeCount: number
  suspendedCount: number
}

export type StudentDirectoryDTO = {
  items: StudentDirectoryItemDTO[]
  pagination: StudentDirectoryPaginationDTO
  summary: StudentDirectorySummaryDTO
}

export type StudentProfileDetailDTO = {
  fullName: string
  targetExam?: string | null
}

export type StudentProgressDetailDTO = {
  enrolledCourses: number
  completedCourses: number
  averageCompletion: number
  completedModules: number
  completedLessons: number
  quizAttempts: number
  mockExamAttempts: number
  achievements: number
}

export type StudentActivityDetailDTO = {
  registeredAt: string
  lastActiveAt: string
}

export type StudentSubscriptionDetailDTO = {
  status: string
  plan: string
  renewsAt: string | null
}

export type StudentDetailDTO = {
  id: string
  email: string
  displayName?: string | null
  fullName: string
  role: 'STUDENT'
  status: StudentStatus
  profile: StudentProfileDetailDTO
  progress: StudentProgressDetailDTO
  activity: StudentActivityDetailDTO
  subscription: StudentSubscriptionDetailDTO
}

export type StudentManagementActionResult = {
  id: string
  status: StudentStatus
}
