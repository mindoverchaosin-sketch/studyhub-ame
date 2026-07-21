import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: { studentProfile: true, adminProfile: true } })
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { studentProfile: true, adminProfile: true } })
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

  async countStudents() {
    return prisma.user.count({ where: { role: { is: { name: 'STUDENT' } } } })
  }

  async countAdmins() {
    return prisma.user.count({ where: { role: { is: { name: 'ADMIN' } } } })
  }
}

export const userRepository = new UserRepository()
