import type { ResourceDTO } from '@/server/application/dto/resource.dto'
import { resourceRepository } from '@/server/repositories/resource.repository'
import type { StudyMaterialType } from '@prisma/client'
import { mapResourceEntityToDTO } from '@/server/application/mappers/resource.mapper'
import { contentAccessService } from '@/server/services/content-access.service'

export type StudentResourceAccess = {
  resource: ResourceDTO
  allowed: boolean
  reason?: string
  requiredFeature?: 'premiumModules'
}

/**
 * ResourceService
 * Handles resource-related database operations
 */

export async function getResourcesByTopic(topicId: string): Promise<ResourceDTO[]> {
  return (await resourceRepository.findByLesson(topicId)).map(mapResourceEntityToDTO)
}

export async function getResourceById(id: string): Promise<ResourceDTO | null> {
  const resource = await resourceRepository.findById(id)
  return resource ? mapResourceEntityToDTO(resource) : null
}

export async function getStudentResourceAccess(
  studentId: string,
  resourceId: string,
  lessonId: string,
  moduleId: string,
): Promise<StudentResourceAccess | null> {
  const resource = await resourceRepository.findPublishedById(resourceId)

  if (!resource || resource.lessonId !== lessonId || resource.moduleId !== moduleId) {
    return null
  }

  const access = await contentAccessService.canAccessStudyMaterial(studentId, resource.isPremium)

  return {
    resource: mapResourceEntityToDTO(resource),
    allowed: access.allowed,
    reason: access.reason,
    requiredFeature: access.requiredFeature === 'premiumModules' ? access.requiredFeature : undefined,
  }
}

export async function getResourcesByType(topicId: string, type: string): Promise<ResourceDTO[]> {
  return (await resourceRepository.findByLessonAndType(topicId, type as unknown as StudyMaterialType)).map(mapResourceEntityToDTO)
}

export async function getPremiumResourcesByTopic(topicId: string): Promise<ResourceDTO[]> {
  const resources = await resourceRepository.findByLesson(topicId)
  return resources.filter((resource) => resource.isPremium).map(mapResourceEntityToDTO)
}

export async function getResourceCount(): Promise<number> {
  return resourceRepository.countAll()
}
