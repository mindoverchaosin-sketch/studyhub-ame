import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class ResourceRepository {
  async findByTopic(topicId: string) {
    return prisma.resource.findMany({
      where: { topicId },
      orderBy: { order: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.resource.findUnique({ where: { id } })
  }

  async create(input: Prisma.ResourceCreateInput) {
    return prisma.resource.create({ data: input })
  }

  async update(id: string, data: Prisma.ResourceUpdateInput) {
    return prisma.resource.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.resource.delete({ where: { id } })
  }
}

export const resourceRepository = new ResourceRepository()
