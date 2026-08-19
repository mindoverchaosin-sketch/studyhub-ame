import type { ModuleEntity } from '../../infrastructure/entities/module.entity'
import type { ModuleDTO } from '../dto/module.dto'

export function mapModuleEntityToDTO(module: ModuleEntity): ModuleDTO {
  return {
    id: module.id,
    courseId: module.courseId,
    slug: module.slug,
    title: module.title,
    moduleNumber: module.moduleNumber,
    description: module.description,
    isPremium: Boolean(module.isPremium),
    difficulty: module.difficulty,
    estimatedHours: module.estimatedHours,
    displayOrder: module.displayOrder,
    status: module.status,
    publishedAt: module.publishedAt,
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  }
}
