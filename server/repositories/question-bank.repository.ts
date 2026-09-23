import prisma from '@/lib/prisma'
import type { Prisma, $Enums } from '@prisma/client'

export class QuestionBankRepository {
  async findAll() {
    return prisma.questionBank.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.questionBank.findUnique({ where: { id } })
  }

  async findStudentQuestionStates(studentId: string, questionIds: string[]) {
    if (questionIds.length === 0) return []

    return prisma.studentQuestionState.findMany({
      where: { studentId, questionId: { in: questionIds } },
      select: { questionId: true, selectedOption: true, answeredAt: true },
    })
  }

  async findAnsweredQuestionIds(studentId: string) {
    const states = await prisma.studentQuestionState.findMany({
      where: { studentId, answeredAt: { not: null } },
      select: { questionId: true },
    })

    return states.map((state) => state.questionId)
  }

  async upsertStudentQuestionState(studentId: string, questionId: string, selectedOption: number | null) {
    const answeredAt = selectedOption === null ? null : new Date()

    return prisma.studentQuestionState.upsert({
      where: { studentId_questionId: { studentId, questionId } },
      update: { selectedOption, answeredAt },
      create: { studentId, questionId, selectedOption, answeredAt },
      select: { questionId: true, selectedOption: true, answeredAt: true },
    })
  }

  async findPublishedWithQuestions(search?: string) {
    return prisma.questionBank.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        ...(search?.trim() ? {
          OR: [
            { title: { contains: search.trim(), mode: 'insensitive' } },
            { description: { contains: search.trim(), mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          where: { status: 'PUBLISHED', deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async findByIdWithCount(id: string) {
    const qb = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        questions: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    })

    if (!qb) return null

    return {
      ...qb,
      questionCount: qb.questions.length,
    }
  }

  async create(input: { title: string; description?: string | null; isPremium?: boolean }) {
    return prisma.questionBank.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        isPremium: input.isPremium ?? false,
        status: 'DRAFT',
      } as any,
    })
  }

  async update(
    id: string,
    data: {
      title?: string
      description?: string | null
      isPremium?: boolean
    }
  ) {
    return prisma.questionBank.update({
      where: { id },
      data,
    })
  }

  async archive(id: string) {
    return prisma.questionBank.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  async publish(id: string) {
    return prisma.questionBank.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    })
  }

  async findForAdmin(params: {
    search?: string
    status?: string
    sortBy?: 'createdAt' | 'title' | 'status'
    sortOrder?: 'asc' | 'desc'
    skip?: number
    take?: number
  }) {
    const where: Prisma.QuestionBankWhereInput = {}

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status as Prisma.EnumStatusFilter
    }

    const orderBy: Prisma.Enumerable<Prisma.QuestionBankOrderByWithRelationInput> =
      params.sortBy ? { [params.sortBy]: params.sortOrder ?? 'desc' } : { createdAt: 'desc' }

    const qbs = await prisma.questionBank.findMany({
      where,
      orderBy,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      include: {
        questions: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
    })

    return qbs.map((qb) => ({
      ...qb,
      questionCount: qb.questions.length,
    }))
  }

  async countForAdmin(params: { search?: string; status?: string }) {
    const where: Prisma.QuestionBankWhereInput = {}

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status as Prisma.EnumStatusFilter
    }

    return prisma.questionBank.count({ where })
  }
}

export const questionBankRepository = new QuestionBankRepository()
