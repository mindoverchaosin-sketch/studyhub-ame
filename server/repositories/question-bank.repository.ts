import prisma from '@/lib/prisma'

export class QuestionBankRepository {
  async findAll() {
    return prisma.questionBank.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.questionBank.findUnique({ where: { id } })
  }
}

export const questionBankRepository = new QuestionBankRepository()
