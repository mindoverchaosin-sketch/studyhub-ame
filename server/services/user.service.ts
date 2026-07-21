import prisma from '@/lib/prisma'

type UserRole = 'STUDENT' | 'ADMIN' | 'INSTRUCTOR'

/**
 * UserService
 * Handles user-related database operations
 */

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      studentProfile: true,
      adminProfile: true,
    },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      studentProfile: true,
      adminProfile: true,
    },
  })
}

export async function getStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  })
}

export async function getAdminProfile(userId: string) {
  return prisma.adminProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  })
}

export async function getUsersByRole(role: UserRole) {
  return prisma.user.findMany({
    where: {
      role: {
        is: {
          name: role,
        },
      },
      isActive: true,
    },
    include: {
      studentProfile: true,
      adminProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUserCountByRole(role: UserRole): Promise<number> {
  return prisma.user.count({
    where: {
      role: {
        is: {
          name: role,
        },
      },
      isActive: true,
    },
  })
}
