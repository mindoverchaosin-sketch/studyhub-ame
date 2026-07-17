import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class ProgressRepository {
  async findStudentProgress(studentId: string) {
    return prisma.topicProgress.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findTopicProgress(studentId: string, topicId: string) {
    return prisma.topicProgress.findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId,
        },
      },
    })
  }

  async updateTopicProgress(input: Prisma.TopicProgressCreateInput | Prisma.TopicProgressUpdateInput) {
    return prisma.topicProgress.create({ data: input as Prisma.TopicProgressCreateInput })
  }
}

export const progressRepository = new ProgressRepository()
