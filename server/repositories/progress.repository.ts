import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class ProgressRepository {
  async findStudentProgress(studentId: string) {
    return prisma.lessonProgress.findMany({
      where: { userId: studentId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findTopicProgress(studentId: string, lessonId: string) {
    return prisma.lessonProgress.findFirst({
      where: {
        userId: studentId,
        lessonId,
      },
    })
  }

  async updateTopicProgress(input: Prisma.LessonProgressCreateInput | Prisma.LessonProgressUpdateInput) {
    return prisma.lessonProgress.create({ data: input as Prisma.LessonProgressCreateInput })
  }
}

export const progressRepository = new ProgressRepository()
