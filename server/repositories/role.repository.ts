import prisma from '@/lib/prisma'

export class RoleRepository {
  async findByName(name: string) {
    return prisma.role.findUnique({ where: { name: name as any } })
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
