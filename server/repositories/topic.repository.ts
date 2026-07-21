import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class TopicRepository {
  async findBySection(sectionId: string) {
    return prisma.lesson.findMany({
      where: { moduleId: sectionId },
      include: { module: true },
      orderBy: { displayOrder: 'asc' },
    })
  }

  async findBySlug(slug: string) {
    return prisma.lesson.findUnique({
      where: { slug },
      include: { module: true },
    })
  }

  async findById(id: string) {
    return prisma.lesson.findUnique({
      where: { id },
      include: { module: true },
    })
  }

  async countAll() {
    return prisma.lesson.count()
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

export const topicRepository = new TopicRepository()
