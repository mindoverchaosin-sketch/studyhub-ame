import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class ModuleRepository {
  async findByCourse(courseId: string) {
    return prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
    })
  }

  async findBySlug(slug: string) {
    return prisma.module.findUnique({ where: { slug } })
  }

  async findById(id: string) {
    return prisma.module.findUnique({ where: { id } })
  }

  async findWithSections(id: string) {
    return prisma.module.findUnique({
      where: { id },
      include: {
        sections: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async create(input: Prisma.ModuleCreateInput) {
    return prisma.module.create({ data: input })
  }

  async update(id: string, data: Prisma.ModuleUpdateInput) {
    return prisma.module.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.module.delete({ where: { id } })
  }

  async setPublishState(id: string, isPublished: boolean) {
    return prisma.module.update({ where: { id }, data: { isPublished } })
  }

  async reorder(courseId: string, orderedIds: string[]) {
    return prisma.$transaction(async (tx) => {
      for (const [index, id] of orderedIds.entries()) {
        await tx.module.update({ where: { id }, data: { order: index + 1 } })
      }
      return tx.module.findMany({ where: { courseId }, orderBy: { order: 'asc' } })
    })
  }
}

export const moduleRepository = new ModuleRepository()
