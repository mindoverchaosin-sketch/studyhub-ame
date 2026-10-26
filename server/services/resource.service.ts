import type { ResourceDTO } from '@/server/application/dto/resource.dto'
import { resourceRepository } from '@/server/repositories/resource.repository'
import type { StudyMaterialType } from '@prisma/client'
import { mapResourceEntityToDTO } from '@/server/application/mappers/resource.mapper'
import { contentAccessService } from '@/server/services/content-access.service'

export type StudentResourceAccess = {
  resource: ResourceDTO
  allowed: boolean
  premiumRequired: boolean
  reason?: string
  requiredFeature?: 'premiumModules'
}

function resolveStudentResourceAccess(studentId: string, resource: Awaited<ReturnType<typeof resourceRepository.findPublishedById>>) {
  if (!resource) return null

  const module = resource.module ?? resource.lesson?.module ?? null
  const lesson = resource.lesson
  if (
    !module
    || module.status !== 'PUBLISHED'
    || module.deletedAt
    || !module.course
    || module.course.status !== 'PUBLISHED'
    || module.course.deletedAt
    || (resource.moduleId && resource.moduleId !== module.id)
    || (lesson && (lesson.status !== 'PUBLISHED' || lesson.deletedAt || lesson.moduleId !== module.id))
  ) {
    return null
  }

  const premiumRequired = resource.isPremium || module.isPremium || module.course.isPremium
  return contentAccessService.canAccessStudyMaterial(
    studentId,
    premiumRequired,
  ).then((access) => ({
    resource: mapResourceEntityToDTO(resource),
    allowed: access.allowed,
    premiumRequired,
    reason: access.reason,
    requiredFeature: access.requiredFeature === 'premiumModules' ? access.requiredFeature : undefined,
  }))
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

  if (
    !resource
    || resource.lessonId !== lessonId
    || (resource.moduleId && resource.moduleId !== moduleId)
    || (!resource.moduleId && resource.lesson?.moduleId !== moduleId)
  ) {
    return null
  }

  return resolveStudentResourceAccess(studentId, resource)
}

export async function getStudentStudyMaterialAccess(
  studentId: string,
  resourceId: string,
): Promise<StudentResourceAccess | null> {
  const resource = await resourceRepository.findPublishedById(resourceId)
  return resolveStudentResourceAccess(studentId, resource)
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
