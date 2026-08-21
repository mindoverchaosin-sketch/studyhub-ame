import type { ResourceDTO } from '@/server/application/dto/resource.dto'
import { resourceRepository } from '@/server/repositories/resource.repository'

export type ResourceCreateInput = {
  moduleId: string
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
    const resourceUrl = validateStudyMaterialUrl(input.url)
    const created = await resourceRepository.create({
      moduleId: input.moduleId,
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
    const updated = await resourceRepository.update(resourceId, {
      ...(input.title ? { title: input.title } : {}),
      ...(input.type ? { materialType: input.type as any } : {}),
      ...(resourceUrl ? { url: resourceUrl } : {}),
      ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
      ...(input.status ? { status: input.status } : {}),
    } as any)

    return { id: updated.id, status: updated.status }
  }

  async archiveResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const updated = await resourceRepository.update(resourceId, { status: 'ARCHIVED' } as any)
    return { id: updated.id, status: updated.status }
  }

  async publishResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const updated = await resourceRepository.update(resourceId, { status: 'PUBLISHED' } as any)
    return { id: updated.id, status: updated.status }
  }

  async unpublishResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const updated = await resourceRepository.update(resourceId, { status: 'DRAFT' } as any)
    return { id: updated.id, status: updated.status }
  }

  async unarchiveResource(resourceId: string): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const updated = await resourceRepository.update(resourceId, { status: 'DRAFT' } as any)
    return { id: updated.id, status: updated.status }
  }

  async reorderResources(moduleId: string, orderedIds: string[]) {
    return resourceRepository.reorder(moduleId, orderedIds)
  }
}
