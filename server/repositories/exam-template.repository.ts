import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class ExamTemplateRepository {
  async listTemplates(params: { search?: string; courseId?: string; active?: boolean; skip?: number; take?: number; sortBy?: 'updated' | 'title' | 'created' } = {}) {
    const where: Prisma.ExamTemplateWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {}),
      ...(params.courseId ? { courseId: params.courseId } : {}),
      ...(typeof params.active === 'boolean' ? { active: params.active } : {}),
    }
    const orderBy = params.sortBy === 'title'
      ? { name: 'asc' as const }
      : params.sortBy === 'created'
        ? { createdAt: 'desc' as const }
        : { updatedAt: 'desc' as const }

    return prisma.examTemplate.findMany({ where, orderBy, skip: params.skip ?? 0, take: params.take ?? 20 })
  }

  async countTemplates(params: { search?: string; courseId?: string; active?: boolean } = {}) {
    const where: Prisma.ExamTemplateWhereInput = {
      ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {}),
      ...(params.courseId ? { courseId: params.courseId } : {}),
      ...(typeof params.active === 'boolean' ? { active: params.active } : {}),
    }
    return prisma.examTemplate.count({ where })
  }

  async getTemplate(id: string) {
    return prisma.examTemplate.findUnique({ where: { id } })
  }

  async createTemplate(data: Prisma.ExamTemplateCreateInput) {
    return prisma.examTemplate.create({ data })
  }

  async updateTemplate(id: string, data: Prisma.ExamTemplateUpdateInput) {
    return prisma.examTemplate.update({ where: { id }, data })
  }

  async deleteTemplate(id: string) {
    return prisma.examTemplate.delete({ where: { id } })
  }

  async activateTemplate(id: string, active: boolean) {
    return prisma.examTemplate.update({ where: { id }, data: { active } })
  }
}

export const examTemplateRepository = new ExamTemplateRepository()
