import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class QuestionRepository {
  async findByTopic(questionBankId: string) {
    return prisma.question.findMany({
      where: { questionBankId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.question.findUnique({ where: { id } })
  }

  async countAll() {
    return prisma.question.count()
  }

  async create(input: Prisma.QuestionCreateInput) {
    return prisma.question.create({ data: input })
  }

  async update(id: string, data: Prisma.QuestionUpdateInput) {
    return prisma.question.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.question.delete({ where: { id } })
  }
}

export const questionRepository = new QuestionRepository()
