import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class SectionRepository {
  async findByModule(moduleId: string) {
    return prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { displayOrder: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.lesson.findUnique({ where: { id } })
  }

  async create(input: Prisma.LessonCreateInput) {
    return prisma.lesson.create({ data: input })
  }

  async update(id: string, data: Prisma.LessonUpdateInput) {
    return prisma.lesson.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.lesson.delete({ where: { id } })
  }

  async setPublishState(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') {
    return prisma.lesson.update({ where: { id }, data: { status } })
  }
}

export const sectionRepository = new SectionRepository()
