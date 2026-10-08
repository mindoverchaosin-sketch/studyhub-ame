import type { ResourceDTO } from '@/server/application/dto/resource.dto'
import { resourceRepository } from '@/server/repositories/resource.repository'
import { lessonRepository } from '@/server/repositories/lesson.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { editorialWorkflowRepository } from '@/server/repositories/editorial-workflow.repository'
import { NotFoundError } from '@/auth'
import { StudyMaterialType } from '@prisma/client'

export type ResourceCreateInput = {
  moduleId: string
  lessonId?: string
  title: string
  description?: string | null
  type: StudyMaterialType
  url?: string
  isPremium?: boolean
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW'
  displayOrder?: number
}

export type ResourceUpdateInput = {
  title?: string
  description?: string | null
  type?: StudyMaterialType
  url?: string
  isPremium?: boolean
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW'
  displayOrder?: number
  lessonId?: string | null
}

export function validateStudyMaterialUrl(value: string): string {
  const url = value.trim()

  if (!url || !url.startsWith('/media/') || url.startsWith('//') || url.includes('\\') || /[\u0000-\u001f\u007f]/.test(url)) {
    throw new Error('Study material URL must be a relative /media/ path')
  }

  const parsed = new URL(url, 'https://study-material.invalid')
  const decodedPath = decodeURIComponent(parsed.pathname)
  if (parsed.origin !== 'https://study-material.invalid' || !parsed.pathname.startsWith('/media/') || decodedPath.split('/').includes('..')) {
    throw new Error('Study material URL must be a relative /media/ path')
  }

  return url
}

async function resolveModuleForBinding(moduleId: string) {
  const selectedModule = await moduleRepository.findById(moduleId)
  if (!selectedModule || selectedModule.deletedAt) {
    throw new Error('Module for binding not found')
  }
  return selectedModule
}

async function resolveLessonForBinding(lessonId: string, expectedModuleId?: string) {
  const lesson = await lessonRepository.findById(lessonId)

  if (!lesson || lesson.deletedAt) {
    throw new Error(`Lesson for binding not found: ${lessonId}`)
  }

  if (expectedModuleId !== undefined && lesson.moduleId !== expectedModuleId) {
    throw new Error('Lesson does not belong to the requested module')
  }

  return lesson
}

export class StudyMaterialManagementService {
  async listResources(moduleId: string): Promise<ResourceDTO[]> {
    const resources = await resourceRepository.findByModule(moduleId)
    const editorialWorkflows = await editorialWorkflowRepository.findByTargets('STUDY_MATERIAL', resources.map((resource) => resource.id))
    const editorialStatuses = new Map(editorialWorkflows.map((workflow) => [workflow.entityId, workflow.status]))

    return resources.map((resource) => ({
      id: resource.id,
      moduleId: resource.moduleId,
      lessonId: resource.lessonId,
      title: resource.title,
      description: null,
      type: resource.materialType,
      url: resource.url ?? '',
      isPremium: resource.isPremium,
      status: resource.status,
      editorialStatus: editorialStatuses.get(resource.id) ?? (resource.status === 'SCHEDULED' ? 'DRAFT' : resource.status),
      publishedAt: resource.publishedAt,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    }))
  }

  async createResource(input: ResourceCreateInput): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW' }> {
    const title = input.title?.trim()
    if (!title) {
      throw new Error('Study material title is required')
    }
    if (!Object.values(StudyMaterialType).includes(input.type)) {
      throw new Error('Study material type is invalid')
    }
    if (!input.moduleId?.trim()) {
      throw new Error('Module is required')
    }
    const selectedModule = await resolveModuleForBinding(input.moduleId)
    const lesson = input.lessonId ? await resolveLessonForBinding(input.lessonId, input.moduleId) : null
    const resourceUrl = input.url?.trim() ? validateStudyMaterialUrl(input.url) : undefined

    let displayOrder: number
    if (input.displayOrder !== undefined) {
      displayOrder = input.displayOrder
    } else {
      const existing = await resourceRepository.findByModule(selectedModule.id)
      const maxOrder = existing.reduce((max, resource) => Math.max(max, resource.displayOrder ?? 0), 0)
      displayOrder = maxOrder + 1
    }

    const created = await resourceRepository.create({
      moduleId: selectedModule.id,
      lessonId: lesson?.id ?? null,
      title,
      materialType: input.type,
      ...(resourceUrl ? { url: resourceUrl } : {}),
      sourceType: 'AEROPREP_DOC',
      isPremium: input.isPremium ?? false,
      status: input.status ?? 'DRAFT',
      displayOrder,
    })

    return { id: created.id, status: created.status }
  }

  async updateResource(resourceId: string, input: ResourceUpdateInput): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW' }> {
    const resourceUrl = input.url === undefined ? undefined : validateStudyMaterialUrl(input.url)
    let bindingUpdate: { lessonId: string | null; moduleId: string | null } | undefined
    let displayOrderUpdate: { displayOrder: number } | undefined

    if (input.lessonId !== undefined) {
      const resource = await resourceRepository.findById(resourceId)
      if (!resource) {
        throw new Error(`Study material not found: ${resourceId}`)
      }
      if (input.lessonId !== null && typeof input.lessonId !== 'string') {
        throw new Error('Lesson binding is invalid')
      }
      if (input.lessonId === null) {
        bindingUpdate = { lessonId: null, moduleId: resource.moduleId }
      } else {
        if (!resource.moduleId) {
          throw new Error('A lesson cannot be bound until the study material has a module.')
        }
        const lesson = await resolveLessonForBinding(input.lessonId)
        if (lesson.moduleId !== resource.moduleId) {
          throw new Error('Target lesson belongs to a different module than the study material')
        }
        bindingUpdate = { lessonId: lesson.id, moduleId: resource.moduleId }
      }

      if (input.displayOrder === undefined && input.lessonId !== null && input.lessonId !== resource.lessonId) {
        if (!resource.moduleId) {
          throw new Error('A lesson cannot be bound until the study material has a module.')
        }
        const existing = await resourceRepository.findByModule(resource.moduleId)
        const maxOrder = existing.reduce((max, resource) => Math.max(max, resource.displayOrder ?? 0), 0)
        displayOrderUpdate = { displayOrder: maxOrder + 1 }
      }
    }

    if (input.displayOrder !== undefined) {
      displayOrderUpdate = { displayOrder: input.displayOrder }
    }

    const updated = await resourceRepository.update(resourceId, {
      ...(input.title ? { title: input.title } : {}),
      ...(input.type ? { materialType: input.type } : {}),
      ...(resourceUrl ? { url: resourceUrl } : {}),
      ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...bindingUpdate,
      ...displayOrderUpdate,
    })

    return { id: updated.id, status: updated.status }
  }

  async archiveResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'ARCHIVED' })
    return { id: updated.id, status: updated.status }
  }

  async publishResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'PUBLISHED' })
    return { id: updated.id, status: updated.status }
  }

  async unpublishResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'DRAFT' })
    return { id: updated.id, status: updated.status }
  }

  async unarchiveResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'IN_REVIEW' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'DRAFT' })
    return { id: updated.id, status: updated.status }
  }

  async reorderResources(moduleId: string, orderedIds: string[]) {
    return resourceRepository.reorder(moduleId, orderedIds)
  }
}
