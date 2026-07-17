import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class TopicRepository {
  async findBySection(sectionId: string) {
    return prisma.topic.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
    })
  }

  async findBySlug(slug: string) {
    return prisma.topic.findUnique({ where: { slug } })
  }

  async findById(id: string) {
    return prisma.topic.findUnique({ where: { id } })
  }

  async create(input: Prisma.TopicCreateInput) {
    return prisma.topic.create({ data: input })
  }

  async update(id: string, data: Prisma.TopicUpdateInput) {
    return prisma.topic.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.topic.delete({ where: { id } })
  }

  async setPublishState(id: string, isPublished: boolean) {
    return prisma.topic.update({ where: { id }, data: { isPublished } })
  }

  async findPrevious(sectionId: string, order: number) {
    return prisma.topic.findFirst({
      where: { sectionId, isPublished: true, order: { lt: order } },
      orderBy: { order: 'desc' },
    })
  }

  async findNext(sectionId: string, order: number) {
    return prisma.topic.findFirst({
      where: { sectionId, isPublished: true, order: { gt: order } },
      orderBy: { order: 'asc' },
    })
  }
}

export const topicRepository = new TopicRepository()
