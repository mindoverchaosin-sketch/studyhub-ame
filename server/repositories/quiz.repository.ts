import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class QuizRepository {
  async findByModule(moduleId: string) {
    return prisma.quiz.findFirst({
      where: { moduleId, status: 'PUBLISHED' },
      include: { questionBanks: true },
    })
  }

  async findByLesson(lessonId: string) {
    return prisma.quiz.findFirst({
      where: {
        module: {
          lessons: {
            some: { id: lessonId },
          },
        },
        status: 'PUBLISHED',
      },
      include: { questionBanks: true },
    })
  }

  async findById(id: string) {
    return prisma.quiz.findUnique({
      where: { id },
      include: { questionBanks: true },
    })
  }

  async findWithQuestions(id: string) {
    return prisma.quiz.findUnique({
      where: { id },
      include: {
        questionBanks: {
          include: {
            questions: true,
          },
        },
      },
    })
  }

  async findAllPublished() {
    return prisma.quiz.findMany({
      where: { status: 'PUBLISHED' },
      include: { questionBanks: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async countAll() {
    return prisma.quiz.count()
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
