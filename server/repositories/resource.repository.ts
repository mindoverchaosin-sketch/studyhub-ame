import prisma from '@/lib/prisma'
import type { Prisma, StudyMaterialType } from '@prisma/client'

export type ResourceAdminFilters = {
  moduleId?: string
  search?: string
  type?: StudyMaterialType | 'ALL'
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'ALL'
}

export class ResourceRepository {
  async findByLesson(lessonId: string) {
    return prisma.studyMaterial.findMany({
      where: { lessonId, status: 'PUBLISHED', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findByModule(moduleId: string) {
    return prisma.studyMaterial.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findForAdmin(filters: ResourceAdminFilters = {}) {
    const where: Prisma.StudyMaterialWhereInput = {
      ...(filters.moduleId ? { moduleId: filters.moduleId } : {}),
      ...(filters.search ? {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { url: { contains: filters.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(filters.type && filters.type !== 'ALL' ? { materialType: filters.type } : {}),
      ...(filters.status && filters.status !== 'ALL' ? { status: filters.status } : {}),
    }

    return prisma.studyMaterial.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { module: true },
    })
  }

  async findById(id: string) {
    return prisma.studyMaterial.findUnique({ where: { id } })
  }

  async findPublishedById(id: string) {
    return prisma.studyMaterial.findFirst({
      where: { id, status: 'PUBLISHED', deletedAt: null },
    })
  }

  async findByLessonAndType(lessonId: string, materialType: StudyMaterialType) {
    return prisma.studyMaterial.findMany({
      where: { lessonId, materialType, status: 'PUBLISHED', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findAll() {
    return prisma.studyMaterial.findMany()
  }

  async countAll() {
    return prisma.studyMaterial.count()
  }

  async create(input: Prisma.StudyMaterialCreateInput) {
    return prisma.studyMaterial.create({ data: input })
  }

  async update(id: string, data: Prisma.StudyMaterialUpdateInput) {
    return prisma.studyMaterial.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.studyMaterial.delete({ where: { id } })
  }

  async reorder(moduleId: string, orderedIds: string[]) {
    return prisma.$transaction(async (tx) => {
      const resources = await tx.studyMaterial.findMany({
        where: { moduleId, deletedAt: null },
      })

      const resourcesById = new Map(resources.map((resource) => [resource.id, resource]))

      const scopeIds = new Set(resources.map((resource) => resource.id))
      const seen = new Set<string>()
      const validOrderedIds = orderedIds.filter((id) => {
        if (seen.has(id)) return false
        seen.add(id)
        return scopeIds.has(id)
      })

      for (const [index, id] of validOrderedIds.entries()) {
        await tx.studyMaterial.update({
          where: { id },
          data: { displayOrder: index + 1 },
        })
      }

      const orderedSet = new Set(validOrderedIds)
      const omittedResources = resources
        .filter((resource) => !orderedSet.has(resource.id))
        .sort((a, b) => {
          if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder
          return a.createdAt.getTime() - b.createdAt.getTime()
        })

      let nextOrder = validOrderedIds.length + 1
      for (const resource of omittedResources) {
        if (resource.displayOrder !== nextOrder) {
          await tx.studyMaterial.update({
            where: { id: resource.id },
            data: { displayOrder: nextOrder },
          })
        }
        nextOrder++
      }

      return tx.studyMaterial.findMany({
        where: { moduleId, deletedAt: null },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      })
    })
  }
}

export const resourceRepository = new ResourceRepository()
