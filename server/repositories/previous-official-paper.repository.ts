import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type PreviousOfficialPaperFilters = {
  courseId?: string
  moduleId?: string
  year?: number
  isPremium?: boolean
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
}

export class PreviousOfficialPaperRepository {
  async findForAdmin(filters: PreviousOfficialPaperFilters = {}) {
    return prisma.previousOfficialPaper.findMany({
      where: {
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.moduleId ? { moduleId: filters.moduleId } : {}),
        ...(filters.year ? { year: filters.year } : {}),
        ...(filters.isPremium === undefined ? {} : { isPremium: filters.isPremium }),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { course: true, module: true },
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
    })
  }

  async findPublished(filters: Pick<PreviousOfficialPaperFilters, 'courseId' | 'moduleId' | 'year' | 'isPremium'> = {}) {
    return prisma.previousOfficialPaper.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.moduleId ? { moduleId: filters.moduleId } : {}),
        ...(filters.year ? { year: filters.year } : {}),
        ...(filters.isPremium === undefined ? {} : { isPremium: filters.isPremium }),
      },
      include: { course: true, module: true },
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
    })
  }

  async findById(id: string) {
    return prisma.previousOfficialPaper.findUnique({ where: { id }, include: { course: true, module: true } })
  }

  async findPublishedById(id: string) {
    return prisma.previousOfficialPaper.findFirst({
      where: { id, status: 'PUBLISHED', deletedAt: null },
      include: { course: true, module: true },
    })
  }

  async create(data: Prisma.PreviousOfficialPaperCreateInput) {
    return prisma.previousOfficialPaper.create({ data, include: { course: true, module: true } })
  }

  async update(id: string, data: Prisma.PreviousOfficialPaperUpdateInput) {
    return prisma.previousOfficialPaper.update({ where: { id }, data, include: { course: true, module: true } })
  }
}

export const previousOfficialPaperRepository = new PreviousOfficialPaperRepository()
