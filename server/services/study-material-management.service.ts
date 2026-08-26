import type { ResourceDTO } from '@/server/application/dto/resource.dto'
import { resourceRepository } from '@/server/repositories/resource.repository'
import { lessonRepository } from '@/server/repositories/lesson.repository'
import { NotFoundError } from '@/auth'

export type ResourceCreateInput = {
  moduleId: string
  lessonId: string
  title: string
  description?: string | null
  type: string
  url: string
  isPremium?: boolean
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  displayOrder?: number
}

export type ResourceUpdateInput = {
  title?: string
  description?: string | null
  type?: string
  url?: string
  isPremium?: boolean
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED'
  displayOrder?: number
  lessonId?: string
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

    return resources.map((resource) => ({
      id: resource.id,
      moduleId: resource.moduleId,
      lessonId: resource.lessonId,
      title: resource.title,
      description: null,
      type: resource.materialType,
      url: resource.url,
      isPremium: resource.isPremium,
      status: resource.status,
      publishedAt: resource.publishedAt,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    }))
  }

  async createResource(input: ResourceCreateInput): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    if (!input.lessonId) {
      throw new Error('lessonId is required to bind a study material to a lesson')
    }
    const resourceUrl = validateStudyMaterialUrl(input.url)
    const lesson = await resolveLessonForBinding(input.lessonId, input.moduleId)
    const created = await resourceRepository.create({
      moduleId: lesson.moduleId,
      lessonId: lesson.id,
      title: input.title,
      materialType: input.type as any,
      url: resourceUrl,
      isPremium: input.isPremium ?? false,
      status: input.status ?? 'DRAFT',
    } as any)

    return { id: created.id, status: created.status }
  }

  async updateResource(resourceId: string, input: ResourceUpdateInput): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const resourceUrl = input.url === undefined ? undefined : validateStudyMaterialUrl(input.url)
    let bindingUpdate: { lessonId: string; moduleId: string } | undefined

    if (input.lessonId !== undefined) {
      const resource = await resourceRepository.findById(resourceId)
      if (!resource) {
        throw new Error(`Study material not found: ${resourceId}`)
      }
      const lesson = await resolveLessonForBinding(input.lessonId)
      if (lesson.moduleId !== resource.moduleId) {
        throw new Error('Target lesson belongs to a different module than the study material')
      }
      bindingUpdate = { lessonId: lesson.id, moduleId: resource.moduleId }
    }

    const updated = await resourceRepository.update(resourceId, {
      ...(input.title ? { title: input.title } : {}),
      ...(input.type ? { materialType: input.type as any } : {}),
      ...(resourceUrl ? { url: resourceUrl } : {}),
      ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...bindingUpdate,
    } as any)

    return { id: updated.id, status: updated.status }
  }

  async archiveResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'ARCHIVED' } as any)
    return { id: updated.id, status: updated.status }
  }

  async publishResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'PUBLISHED' } as any)
    return { id: updated.id, status: updated.status }
  }

  async unpublishResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'DRAFT' } as any)
    return { id: updated.id, status: updated.status }
  }

  async unarchiveResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const resource = await resourceRepository.findById(resourceId)
    if (!resource) throw new NotFoundError('Study material not found')

    const updated = await resourceRepository.update(resourceId, { status: 'DRAFT' } as any)
    return { id: updated.id, status: updated.status }
  }

  async reorderResources(moduleId: string, orderedIds: string[]) {
    return resourceRepository.reorder(moduleId, orderedIds)
  }
}
