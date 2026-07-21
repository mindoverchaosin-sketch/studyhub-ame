import type { ResourceEntity } from '../../infrastructure/entities/resource.entity'
import type { ResourceDTO } from '../dto/resource.dto'

export function mapResourceEntityToDTO(resource: ResourceEntity): ResourceDTO {
  return {
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
  }
}
