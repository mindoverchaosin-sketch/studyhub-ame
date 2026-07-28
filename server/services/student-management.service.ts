import type { StudentDetailDTO, StudentDirectoryDTO, StudentDirectoryFilters, StudentManagementActionResult } from '@/server/application/dto/student-management.dto'
import { userRepository } from '@/server/repositories/user.repository'

function toStatus(isActive: boolean | null | undefined): 'ACTIVE' | 'SUSPENDED' {
  return isActive === false ? 'SUSPENDED' : 'ACTIVE'
}

function normalizeFilters(filters: StudentDirectoryFilters = {}) {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  return {
    search: filters.search?.trim() || undefined,
    status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
    role: filters.role && filters.role !== 'ALL' ? filters.role : undefined,
    skip,
    take: pageSize,
    sortBy: filters.sortBy ?? 'newest',
  }
}

export async function getStudentManagementDirectory(filters: StudentDirectoryFilters = {}): Promise<StudentDirectoryDTO> {
  const normalized = normalizeFilters(filters)
  const [items, totalItems, activeCount, suspendedCount] = await Promise.all([
    userRepository.findStudentsForAdmin(normalized),
    userRepository.countStudentsForAdmin(normalized),
    userRepository.countStudentsForAdmin({ ...normalized, status: 'ACTIVE' }),
    userRepository.countStudentsForAdmin({ ...normalized, status: 'SUSPENDED' }),
  ])

  const pageSize = normalized.take
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return {
    items: items.map((student) => ({
      id: student.id,
      email: student.email,
      fullName: student.studentProfile?.fullName ?? student.displayName ?? student.email,
      displayName: student.displayName,
      status: toStatus(student.isActive),
      createdAt: student.createdAt.toISOString(),
      lastActiveAt: student.updatedAt.toISOString(),
      role: 'STUDENT',
    })),
    pagination: {
      page: normalized.skip / pageSize + 1,
      pageSize,
      totalItems,
      totalPages,
    },
    summary: {
      totalCount: totalItems,
      activeCount,
      suspendedCount,
    },
  }
}

export async function getStudentDetail(studentId: string): Promise<StudentDetailDTO> {
  const student = await userRepository.findStudentDetail(studentId)

  if (!student) {
    throw new Error('Student not found')
  }

  return {
    id: student.id,
    email: student.email,
    displayName: student.displayName,
    fullName: student.studentProfile?.fullName ?? student.displayName ?? student.email,
    role: 'STUDENT',
    status: toStatus(student.isActive),
    profile: {
      fullName: student.studentProfile?.fullName ?? student.displayName ?? student.email,
      targetExam: student.studentProfile?.targetExam ?? null,
    },
    progress: {
      enrolledCourses: student.enrollments?.length ?? 0,
      completedCourses: student.progress?.filter((entry) => entry.completionPercent >= 100).length ?? 0,
      averageCompletion: student.progress?.length ? Math.round((student.progress.reduce((sum, entry) => sum + entry.completionPercent, 0) / student.progress.length) * 10) / 10 : 0,
      completedModules: student.moduleProgress?.filter((entry) => entry.percentComplete >= 100).length ?? 0,
      completedLessons: student.lessonProgress?.filter((entry) => entry.percentComplete >= 100).length ?? 0,
      quizAttempts: student.quizAttempts?.length ?? 0,
      mockExamAttempts: student.mockTestAttempts?.length ?? 0,
      achievements: student.achievements?.length ?? 0,
    },
    activity: {
      registeredAt: student.createdAt.toISOString(),
      lastActiveAt: student.updatedAt.toISOString(),
    },
    subscription: {
      status: 'Pending',
      plan: 'Standard',
      renewsAt: null,
    },
  }
}

export async function suspendStudentAccount(studentId: string): Promise<StudentManagementActionResult> {
  const student = await userRepository.updateStudentStatus(studentId, false)
  return {
    id: student.id,
    status: toStatus(student.isActive),
  }
}

export async function reactivateStudentAccount(studentId: string): Promise<StudentManagementActionResult> {
  const student = await userRepository.updateStudentStatus(studentId, true)
  return {
    id: student.id,
    status: toStatus(student.isActive),
  }
}

export async function resetStudentProgress(studentId: string) {
  return userRepository.resetStudentProgress(studentId)
}
