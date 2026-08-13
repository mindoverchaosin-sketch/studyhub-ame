import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type AdminUserQueryParams = {
  search?: string
  role?: string
  status?: 'ACTIVE' | 'SUSPENDED'
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
    const where: Prisma.UserWhereInput = {
      ...(params.search ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { displayName: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.role ? { role: { is: { name: params.role as any } } } : {}),
      ...(params.status ? { isActive: params.status === 'ACTIVE' } : {}),
    }

    return prisma.user.findMany({
      where,
      include: { role: true },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy: { createdAt: 'desc' },
    })
  }

  async countManyForAdmin(params: AdminUserQueryParams = {}) {
    const where: Prisma.UserWhereInput = {
      ...(params.search ? {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { displayName: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.role ? { role: { is: { name: params.role as any } } } : {}),
      ...(params.status ? { isActive: params.status === 'ACTIVE' } : {}),
    }

    return prisma.user.count({ where })
  }
}

export const userRepository = new UserRepository()
