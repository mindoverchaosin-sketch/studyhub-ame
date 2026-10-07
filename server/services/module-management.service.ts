import type { ModuleDetailDTO, ModuleDirectoryDTO, ModuleDirectoryFilters, ModuleManagementActionResult } from '@/server/application/dto/module-management.dto'
import { moduleRepository } from '@/server/repositories/module.repository'
import { NotFoundError } from '@/auth'

function toStatus(status: string): 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' {
  return (status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') ?? 'DRAFT'
}

function toExamType(courseTitle?: string | null): 'DGCA' | 'EASA' | 'BOTH' {
  if (!courseTitle) return 'BOTH'
  if (courseTitle.toLowerCase().includes('dgca')) return 'DGCA'
  if (courseTitle.toLowerCase().includes('easa')) return 'EASA'
  return 'BOTH'
}

function normalizeFilters(filters: ModuleDirectoryFilters = {}) {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  return {
    search: filters.search?.trim() || undefined,
    examType: filters.examType && filters.examType !== 'ALL' ? filters.examType : undefined,
    status: filters.status && filters.status !== 'ALL' ? filters.status : undefined,
    sortBy: filters.sortBy ?? 'updated',
    skip,
    take: pageSize,
  }
}

export class ModuleManagementService {
  async listModules(filters: ModuleDirectoryFilters = {}): Promise<ModuleDirectoryDTO> {
    const normalized = normalizeFilters(filters)
    const [items, totalItems, publishedCount, draftCount, archivedCount] = await Promise.all([
      moduleRepository.findModulesForAdmin(normalized),
      moduleRepository.countModulesForAdmin(normalized),
      moduleRepository.countModulesForAdmin({ ...normalized, status: 'PUBLISHED' }),
      moduleRepository.countModulesForAdmin({ ...normalized, status: 'DRAFT' }),
      moduleRepository.countModulesForAdmin({ ...normalized, status: 'ARCHIVED' }),
    ])

    return {
      items: items.map((module) => ({
        id: module.id,
        title: module.title,
        slug: module.slug,
        moduleNumber: module.moduleNumber,
        examType: toExamType(module.course?.title),
        status: module.status,
        description: module.description ?? '',
        updatedAt: module.updatedAt.toISOString(),
        createdAt: module.createdAt.toISOString(),
        lessonCount: module.lessons?.length ?? 0,
        resourceCount: module.studyMaterials?.length ?? 0,
      })),
      pagination: {
        page: normalized.skip / normalized.take + 1,
        pageSize: normalized.take,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / normalized.take)),
      },
      summary: {
        totalCount: totalItems,
        publishedCount,
        draftCount,
        archivedCount,
      },
    }
  }

  async getModuleDetail(moduleId: string): Promise<ModuleDetailDTO> {
    const moduleDetail = await moduleRepository.getModuleDetail(moduleId)
    if (!moduleDetail) throw new NotFoundError('Module not found')

    return {
      id: moduleDetail.id,
      title: moduleDetail.title,
      slug: moduleDetail.slug,
      moduleNumber: moduleDetail.moduleNumber,
      description: moduleDetail.description ?? '',
      examType: toExamType(moduleDetail.course?.title),
      status: moduleDetail.status,
      difficulty: moduleDetail.difficulty,
      estimatedHours: moduleDetail.estimatedHours,
      displayOrder: moduleDetail.displayOrder,
      updatedAt: moduleDetail.updatedAt.toISOString(),
      createdAt: moduleDetail.createdAt.toISOString(),
      publishedAt: moduleDetail.publishedAt?.toISOString() ?? null,
      lessons: (moduleDetail.lessons ?? []).map((lesson: { id: string; title: string; displayOrder: number; status: string }) => ({ id: lesson.id, title: lesson.title, displayOrder: lesson.displayOrder, status: lesson.status })),
      resources: (moduleDetail.studyMaterials ?? []).map((resource: { id: string; title: string; materialType: string; status: string; displayOrder?: number | null }) => ({ id: resource.id, title: resource.title, type: resource.materialType, status: resource.status, displayOrder: resource.displayOrder ?? 0 })),
    }
  }

  async createModule(input: { title: string; slug: string; moduleNumber: string; description?: string; courseId: string; status?: string; difficulty?: string; estimatedHours?: number; displayOrder?: number; isPremium?: boolean }) {
    const created = await moduleRepository.create({
      title: input.title,
      slug: input.slug,
      moduleNumber: input.moduleNumber,
      description: input.description,
      courseId: input.courseId,
      status: (input.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') ?? 'DRAFT',
      difficulty: (input.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') ?? 'BEGINNER',
      estimatedHours: input.estimatedHours ?? 0,
      displayOrder: input.displayOrder ?? 0,
      isPremium: input.isPremium ?? false,
    })

    return { id: created.id, status: created.status }
  }

  async updateModule(moduleId: string, input: { title?: string; slug?: string; moduleNumber?: string; description?: string; status?: string; difficulty?: string; estimatedHours?: number; displayOrder?: number; isPremium?: boolean }) {
    const existingModule = await moduleRepository.findById(moduleId)
    if (!existingModule) throw new NotFoundError('Module not found')

    const updated = await moduleRepository.update(moduleId, {
      ...(input.title ? { title: input.title } : {}),
      ...(input.slug ? { slug: input.slug } : {}),
      ...(input.moduleNumber ? { moduleNumber: input.moduleNumber } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status ? { status: input.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' } : {}),
      ...(input.difficulty ? { difficulty: input.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' } : {}),
      ...(input.estimatedHours !== undefined ? { estimatedHours: input.estimatedHours } : {}),
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
    })

    return { id: updated.id, status: updated.status }
  }

  async archiveModule(moduleId: string): Promise<ModuleManagementActionResult> {
    const existingModule = await moduleRepository.findById(moduleId)
    if (!existingModule) throw new NotFoundError('Module not found')

    const updated = await moduleRepository.update(moduleId, { status: 'ARCHIVED' })
    return { id: updated.id, status: updated.status }
  }

  async unarchiveModule(moduleId: string): Promise<ModuleManagementActionResult> {
    const existingModule = await moduleRepository.findById(moduleId)
    if (!existingModule) throw new NotFoundError('Module not found')

    const updated = await moduleRepository.setPublishState(moduleId, 'DRAFT')
    return { id: updated.id, status: updated.status }
  }
}
