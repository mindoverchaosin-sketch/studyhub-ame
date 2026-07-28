import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type ModuleAdminQueryParams = {
  search?: string
  examType?: 'DGCA' | 'EASA' | 'BOTH'
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  sortBy?: 'updated' | 'title' | 'created'
  skip?: number
  take?: number
}

export class ModuleRepository {
  async findByCourse(courseId: string) {
    return prisma.module.findMany({
      where: { courseId },
      orderBy: { displayOrder: 'asc' },
    })
  }

  async findBySlug(slug: string) {
    return prisma.module.findUnique({ where: { slug } })
  }

  async findById(id: string) {
    return prisma.module.findUnique({ where: { id } })
  }

  async findManyByIds(ids: string[]) {
    if (!ids.length) return []
    return prisma.module.findMany({ where: { id: { in: ids } } })
  }

  async findAll() {
    return prisma.module.findMany()
  }

  async countAll() {
    return prisma.module.count()
  }

  async findModulesForAdmin(params: ModuleAdminQueryParams = {}) {
    const where: Prisma.ModuleWhereInput = {
      ...(params.search ? {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { slug: { contains: params.search, mode: 'insensitive' } },
          { moduleNumber: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.examType ? { course: { title: { contains: params.examType, mode: 'insensitive' } } } : {}),
    }

    const orderBy = params.sortBy === 'title'
      ? [{ title: 'asc' as const }]
      : params.sortBy === 'created'
        ? [{ createdAt: 'desc' as const }]
        : [{ updatedAt: 'desc' as const }]

    return prisma.module.findMany({
      where,
      include: { course: true, lessons: true, studyMaterials: true },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy,
    })
  }

  async countModulesForAdmin(params: ModuleAdminQueryParams = {}) {
    const where: Prisma.ModuleWhereInput = {
      ...(params.search ? {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { slug: { contains: params.search, mode: 'insensitive' } },
          { moduleNumber: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.examType ? { course: { title: { contains: params.examType, mode: 'insensitive' } } } : {}),
    }

    return prisma.module.count({ where })
  }

  async getModuleDetail(id: string) {
    return prisma.module.findUnique({
      where: { id },
      include: { course: true, lessons: true, studyMaterials: true },
    })
  }

  async findWithSections(id: string) {
    return prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { displayOrder: 'asc' },
        },
      },
    })
  }

  async create(input: Prisma.ModuleCreateInput) {
    return prisma.module.create({ data: input })
  }

  async update(id: string, data: Prisma.ModuleUpdateInput) {
    return prisma.module.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.module.delete({ where: { id } })
  }

  async setPublishState(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') {
    return prisma.module.update({ where: { id }, data: { status } })
  }

  async reorder(courseId: string, orderedIds: string[]) {
    return prisma.$transaction(async (tx) => {
      for (const [index, id] of orderedIds.entries()) {
        await tx.module.update({ where: { id }, data: { displayOrder: index + 1 } })
      }
      return tx.module.findMany({ where: { courseId }, orderBy: { displayOrder: 'asc' } })
    })
  }
}

export const moduleRepository = new ModuleRepository()
