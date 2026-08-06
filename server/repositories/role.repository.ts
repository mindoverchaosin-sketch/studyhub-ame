import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class RoleRepository {
  async findByName(name: string) {
    return prisma.role.findUnique({ where: { name: name as Prisma.RoleWhereUniqueInput['name'] } })
  }

  async create(input: Prisma.RoleCreateInput) {
    return prisma.role.create({ data: input })
  }

  async getPermissionsForUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: {
              select: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    })
  }
}

export const roleRepository = new RoleRepository()
