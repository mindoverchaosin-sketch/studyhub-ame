import prisma from '@/lib/prisma'
import type { ApprovalStatus, Prisma, RoleName } from '@prisma/client'

type AdminUserQueryParams = {
  search?: string
  role?: RoleName | 'ALL'
  status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
  approvalStatus?: ApprovalStatus
  skip?: number
  take?: number
}

type StudentAdminQueryParams = {
  search?: string
  status?: 'ACTIVE' | 'SUSPENDED'
  role?: 'STUDENT'
  skip?: number
  take?: number
  sortBy?: 'newest' | 'lastActive' | 'name'
}

export function effectiveAccountStatusWhere(status?: AdminUserQueryParams['status']): Prisma.UserWhereInput | undefined {
  if (!status) return undefined
  if (status === 'TERMINATED') return { accountStatus: 'TERMINATED' }

  const notTerminated: Prisma.UserWhereInput = { accountStatus: { not: 'TERMINATED' } }
  const expiredTemporarySuspension: Prisma.UserWhereInput = {
    suspensionType: 'TEMPORARY',
    suspensionEndsAt: { lte: new Date() },
  }

  if (status === 'ACTIVE') {
    return {
      AND: [
        notTerminated,
        {
          OR: [
            { AND: [{ isActive: true }, { accountStatus: { not: 'SUSPENDED' } }] },
            expiredTemporarySuspension,
          ],
        },
      ],
    }
  }

  return {
    AND: [
      notTerminated,
      { OR: [{ isActive: false }, { accountStatus: 'SUSPENDED' }] },
      {
        OR: [
          { suspensionType: null },
          { suspensionType: { not: 'TEMPORARY' } },
          { suspensionEndsAt: null },
          { suspensionEndsAt: { gt: new Date() } },
        ],
      },
    ],
  }
}

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: { studentProfile: true, adminProfile: true, instructorProfile: true, role: true } })
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { studentProfile: true, adminProfile: true, instructorProfile: true, role: true } })
  }

  async findStudentProfile(userId: string) {
    return prisma.studentProfile.findUnique({ where: { userId }, include: { user: true } })
  }

  async findAdminProfile(userId: string) {
    return prisma.adminProfile.findUnique({ where: { userId }, include: { user: true } })
  }

  async findByRole(role: string) {
    return prisma.user.findMany({
      where: {
        role: {
          is: {
            name: role as 'STUDENT' | 'ADMIN' | 'INSTRUCTOR',
          },
        },
        isActive: true,
      },
      include: { studentProfile: true, adminProfile: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async revokeAllSessionsForUser(userId: string) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.session.deleteMany({ where: { userId } })
      const updated = await tx.user.update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } })

      return { deletedCount: deleted.count, sessionVersion: updated.sessionVersion }
    })
  }

  async findStudentsForAdmin(params: StudentAdminQueryParams = {}) {
    const where: Prisma.UserWhereInput = {
      role: { is: { name: 'STUDENT' } },
      ...(params.search ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { displayName: { contains: params.search, mode: 'insensitive' } },
          { studentProfile: { fullName: { contains: params.search, mode: 'insensitive' } } },
        ],
      } : {}),
      ...(params.status ? { isActive: params.status === 'ACTIVE' } : {}),
    }

    const orderBy = params.sortBy === 'name'
      ? [{ displayName: 'asc' as const }, { createdAt: 'desc' as const }]
      : params.sortBy === 'lastActive'
        ? [{ updatedAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }]

    return prisma.user.findMany({
      where,
      include: { studentProfile: true },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy,
    })
  }

  async countStudentsForAdmin(params: StudentAdminQueryParams = {}) {
    const where: Prisma.UserWhereInput = {
      role: { is: { name: 'STUDENT' } },
      ...(params.search ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { displayName: { contains: params.search, mode: 'insensitive' } },
          { studentProfile: { fullName: { contains: params.search, mode: 'insensitive' } } },
        ],
      } : {}),
      ...(params.status ? { isActive: params.status === 'ACTIVE' } : {}),
    }

    return prisma.user.count({ where })
  }

  async countStudents() {
    return prisma.user.count({ where: { role: { is: { name: 'STUDENT' } } } })
  }

  async findStudentDetail(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        role: true,
        enrollments: {
          include: {
            course: true,
          },
        },
        progress: true,
        moduleProgress: true,
        lessonProgress: true,
        quizAttempts: true,
        mockTestAttempts: true,
        achievements: true,
      },
    })
  }

  async updateStudentStatus(id: string, isActive: boolean) {
    return prisma.user.update({ where: { id }, data: { isActive } })
  }

  async resetStudentProgress(id: string) {
    const progress = await prisma.progress.deleteMany({ where: { userId: id } })
    const moduleProgress = await prisma.moduleProgress.deleteMany({ where: { userId: id } })
    const lessonProgress = await prisma.lessonProgress.deleteMany({ where: { userId: id } })
    const quizAttempts = await prisma.quizAttempt.deleteMany({ where: { userId: id } })
    const mockTestAttempts = await prisma.mockTestAttempt.deleteMany({ where: { userId: id } })

    return { deletedCount: progress.count + moduleProgress.count + lessonProgress.count + quizAttempts.count + mockTestAttempts.count }
  }

  async countAdmins() {
    return prisma.user.count({ where: { role: { is: { name: 'ADMIN' } } } })
  }

  async createUser(input: Prisma.UserCreateInput) {
    return prisma.user.create({ data: input })
  }

  async createStudentProfile(input: Prisma.StudentProfileCreateInput) {
    return prisma.studentProfile.create({ data: input })
  }

  async findManyForAdmin(params: AdminUserQueryParams = {}) {
    const andFilters: Prisma.UserWhereInput[] = []
    const effectiveStatus = effectiveAccountStatusWhere(params.status)
    if (effectiveStatus) andFilters.push(effectiveStatus)
    if (params.approvalStatus) {
      andFilters.push({
        OR: [
          { adminProfile: { is: { status: params.approvalStatus } } },
          { instructorProfile: { is: { status: params.approvalStatus } } },
        ],
      })
    }

    const where: Prisma.UserWhereInput = {
      ...(params.search ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { displayName: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.role && params.role !== 'ALL' ? { role: { is: { name: params.role } } } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
    }

    return prisma.user.findMany({
      where,
      include: { role: true, adminProfile: true, instructorProfile: true },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy: { createdAt: 'desc' },
    })
  }

  async countManyForAdmin(params: AdminUserQueryParams = {}) {
    const andFilters: Prisma.UserWhereInput[] = []
    const effectiveStatus = effectiveAccountStatusWhere(params.status)
    if (effectiveStatus) andFilters.push(effectiveStatus)
    if (params.approvalStatus) {
      andFilters.push({
        OR: [
          { adminProfile: { is: { status: params.approvalStatus } } },
          { instructorProfile: { is: { status: params.approvalStatus } } },
        ],
      })
    }

    const where: Prisma.UserWhereInput = {
      ...(params.search ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { displayName: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.role && params.role !== 'ALL' ? { role: { is: { name: params.role } } } : {}),
      ...(andFilters.length ? { AND: andFilters } : {}),
    }

    return prisma.user.count({ where })
  }
}

export const userRepository = new UserRepository()
