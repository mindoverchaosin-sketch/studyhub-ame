import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class QuizRepository {
  async findByTopic(topicId: string) {
    return prisma.quiz.findFirst({
      where: { topicId, isPublished: true },
    })
  }

  async findById(id: string) {
    return prisma.quiz.findUnique({ where: { id } })
  }

  async findWithQuestions(id: string) {
    return prisma.quiz.findUnique({
      where: { id },
      include: {
        quizQuestions: {
          include: { question: true },
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async create(input: Prisma.QuizCreateInput) {
    return prisma.quiz.create({ data: input })
  }

  async update(id: string, data: Prisma.QuizUpdateInput) {
    return prisma.quiz.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.quiz.delete({ where: { id } })
  }
}

export const quizRepository = new QuizRepository()
