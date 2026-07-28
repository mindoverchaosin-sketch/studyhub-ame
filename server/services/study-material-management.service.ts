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
    const created = await resourceRepository.create({
      moduleId: input.moduleId,
      title: input.title,
      materialType: input.type as any,
      url: input.url,
      isPremium: input.isPremium ?? false,
      status: input.status ?? 'DRAFT',
    } as any)

    return { id: created.id, status: created.status }
  }

  async updateResource(resourceId: string, input: ResourceUpdateInput): Promise<{ id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' }> {
    const updated = await resourceRepository.update(resourceId, {
      ...(input.title ? { title: input.title } : {}),
      ...(input.type ? { materialType: input.type as any } : {}),
      ...(input.url ? { url: input.url } : {}),
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
