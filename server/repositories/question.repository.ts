import prisma from '@/lib/prisma'
import type { Prisma, $Enums } from '@prisma/client'

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

  async findManyByIds(ids: string[]) {
    if (!ids.length) return []
    return prisma.question.findMany({ where: { id: { in: ids } } })
  }

  async findAll() {
    return prisma.question.findMany()
  }

  async countAll() {
    return prisma.question.count()
  }

  async findForAdmin(params: { search?: string; status?: string; difficulty?: string; sortBy?: 'createdAt' | 'difficulty' | 'status' | 'prompt'; sortOrder?: 'asc' | 'desc'; skip?: number; take?: number }) {
    const where: Prisma.QuestionWhereInput = {}

    if (params.search) {
      where.prompt = { contains: params.search, mode: 'insensitive' }
    }

    if (params.status) {
      where.status = params.status as Prisma.EnumStatusFilter
    }

    if (params.difficulty) {
      where.difficulty = params.difficulty as Prisma.EnumDifficultyFilter
    }

    let orderBy: Prisma.Enumerable<Prisma.QuestionOrderByWithRelationInput> = { createdAt: 'desc' }

    if (params.sortBy) {
      orderBy = { [params.sortBy]: params.sortOrder ?? 'desc' }
    }

    return prisma.question.findMany({
      where,
      orderBy,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    })
  }

  async countForAdmin(params: { search?: string; status?: string; difficulty?: string }) {
    const where: Prisma.QuestionWhereInput = {}

    if (params.search) {
      where.prompt = { contains: params.search, mode: 'insensitive' }
    }

    if (params.status) {
      where.status = params.status as Prisma.EnumStatusFilter
    }

    if (params.difficulty) {
      where.difficulty = params.difficulty as Prisma.EnumDifficultyFilter
    }

    return prisma.question.count({ where })
  }

  async findAdmin(params: { search?: string; status?: string; difficulty?: string; sortBy?: 'createdAt' | 'difficulty' | 'status' | 'prompt'; sortOrder?: 'asc' | 'desc'; skip?: number; take?: number }) {
    const where: Prisma.QuestionWhereInput = {}

    if (params.search) {
      where.prompt = { contains: params.search, mode: 'insensitive' }
    }

    if (params.status) {
      where.status = params.status as Prisma.EnumStatusFilter
    }

    if (params.difficulty) {
      where.difficulty = params.difficulty as Prisma.EnumDifficultyFilter
    }

    let orderBy: Prisma.Enumerable<Prisma.QuestionOrderByWithRelationInput> = { createdAt: 'desc' }

    if (params.sortBy) {
      orderBy = { [params.sortBy]: params.sortOrder ?? 'desc' }
    }

    return prisma.question.findMany({
      where,
      orderBy,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    })
  }

  async countAdmin(params: { search?: string; status?: string; difficulty?: string }) {
    const where: Prisma.QuestionWhereInput = {}

    if (params.search) {
      where.prompt = { contains: params.search, mode: 'insensitive' }
    }

    if (params.status) {
      where.status = params.status as Prisma.EnumStatusFilter
    }

    if (params.difficulty) {
      where.difficulty = params.difficulty as Prisma.EnumDifficultyFilter
    }

    return prisma.question.count({ where })
  }

  async findByBank(questionBankId: string) {
    return prisma.question.findMany({ where: { questionBankId } })
  }

  async create(input: Prisma.QuestionCreateInput) {
    return prisma.question.create({ data: input })
  }

  async createManyInTransaction(inputs: Prisma.QuestionCreateInput[]) {
    return prisma.$transaction(inputs.map((input) => prisma.question.create({ data: input })))
  }

  async update(id: string, data: Prisma.QuestionUpdateInput) {
    return prisma.question.update({ where: { id }, data })
  }

  async updateStatus(id: string, status: $Enums.Status) {
    return prisma.question.update({ where: { id }, data: { status } })
  }

  async archive(id: string) {
    return prisma.question.update({ where: { id }, data: { status: 'ARCHIVED' } })
  }

  async restore(id: string) {
    return prisma.question.update({ where: { id }, data: { status: 'DRAFT' } })
  }

  async delete(id: string) {
    return prisma.question.delete({ where: { id } })
  }
}

export const questionRepository = new QuestionRepository()
