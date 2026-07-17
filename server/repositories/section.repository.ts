import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class SectionRepository {
  async findByModule(moduleId: string) {
    return prisma.section.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.section.findUnique({ where: { id } })
  }

  async create(input: Prisma.SectionCreateInput) {
    return prisma.section.create({ data: input })
  }

  async update(id: string, data: Prisma.SectionUpdateInput) {
    return prisma.section.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.section.delete({ where: { id } })
  }

  async setPublishState(id: string, isPublished: boolean) {
    return prisma.section.update({ where: { id }, data: { isPublished } })
  }
}

export const sectionRepository = new SectionRepository()
