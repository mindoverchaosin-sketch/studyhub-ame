import prisma from '@/lib/prisma'

export class ExamTemplateRepository {
  async listTemplates(params: { search?: string; active?: boolean; skip?: number; take?: number } = {}) {
    const where: any = {}
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' }
    if (typeof params.active === 'boolean') where.active = params.active

    // use any to avoid relying on generated Prisma types in this sprint
    return (prisma as any).examTemplate.findMany({ where, orderBy: { createdAt: 'desc' }, skip: params.skip ?? 0, take: params.take ?? 20 })
  }

  async getTemplate(id: string) {
    return (prisma as any).examTemplate.findUnique({ where: { id } })
  }

  async createTemplate(data: any) {
    return (prisma as any).examTemplate.create({ data })
  }

  async updateTemplate(id: string, data: any) {
    return (prisma as any).examTemplate.update({ where: { id }, data })
  }

  async deleteTemplate(id: string) {
    return (prisma as any).examTemplate.delete({ where: { id } })
  }

  async activateTemplate(id: string, active: boolean) {
    return (prisma as any).examTemplate.update({ where: { id }, data: { active } })
  }
}

export const examTemplateRepository = new ExamTemplateRepository()
