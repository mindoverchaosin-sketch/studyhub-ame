import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class QuizRepository {
  async findForAdmin(params: { moduleId?: string; search?: string; status?: string } = {}) {
    const where: Prisma.QuizWhereInput = {
      deletedAt: null,
      ...(params.moduleId ? { moduleId: params.moduleId } : {}),
      ...(params.status && params.status !== 'ALL' ? { status: params.status as Prisma.EnumStatusFilter } : {}),
      ...(params.search?.trim() ? { title: { contains: params.search.trim(), mode: 'insensitive' } } : {}),
    }

    return prisma.quiz.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
      include: {
        module: { select: { id: true, title: true } },
        questionBanks: { select: { id: true, title: true, status: true } },
        _count: { select: { attempts: true } },
      },
    })
  }

  async findForAdminById(id: string) {
    return prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: {
        questionBanks: { select: { id: true } },
        _count: { select: { attempts: true } },
      },
    })
  }

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

  async findPublishedWithQuestions(id: string) {
    return prisma.quiz.findFirst({
      where: { id, status: 'PUBLISHED', deletedAt: null },
      include: {
        questionBanks: {
          where: { status: 'PUBLISHED', deletedAt: null },
          include: { questions: { where: { status: 'PUBLISHED', deletedAt: null } } },
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
