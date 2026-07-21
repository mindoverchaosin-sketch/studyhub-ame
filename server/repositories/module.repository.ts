import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class ModuleRepository {
  async findByCourse(courseId: string) {
    return prisma.module.findMany({
      where: { courseId },
      orderBy: { displayOrder: 'asc' },
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
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { displayOrder: 'asc' },
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

  async setPublishState(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') {
    return prisma.module.update({ where: { id }, data: { status } })
  }

  async reorder(courseId: string, orderedIds: string[]) {
    return prisma.$transaction(async (tx) => {
      for (const [index, id] of orderedIds.entries()) {
        await tx.module.update({ where: { id }, data: { displayOrder: index + 1 } })
      }
      return tx.module.findMany({ where: { courseId }, orderBy: { displayOrder: 'asc' } })
    })
  }
}

export const moduleRepository = new ModuleRepository()
