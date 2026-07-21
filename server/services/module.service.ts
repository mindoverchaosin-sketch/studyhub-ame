import type { ModuleDTO, ModuleWithSectionsDTO } from '@/server/application/dto/module.dto'
import type { LessonDTO } from '@/server/application/dto/lesson.dto'
import { moduleRepository } from '@/server/repositories/module.repository'
import { mapModuleEntityToDTO } from '@/server/application/mappers/module.mapper'
import { mapLessonEntityToDTO } from '@/server/application/mappers/lesson.mapper'

/**
 * ModuleService
 * Handles module-related database operations
 */

export async function getModulesByCourse(courseId: string): Promise<ModuleDTO[]> {
  return (await moduleRepository.findByCourse(courseId)).map(mapModuleEntityToDTO)
}

export async function getModuleBySlug(slug: string): Promise<ModuleDTO | null> {
  const moduleRecord = await moduleRepository.findBySlug(slug)
  return moduleRecord ? mapModuleEntityToDTO(moduleRecord) : null
}

export async function getModuleById(id: string): Promise<ModuleDTO | null> {
  const moduleRecord = await moduleRepository.findById(id)
  return moduleRecord ? mapModuleEntityToDTO(moduleRecord) : null
}

export async function getModuleWithSections(id: string): Promise<ModuleWithSectionsDTO | null> {
  const moduleRecord = await moduleRepository.findWithSections(id)

  if (!moduleRecord) {
    return null
  }

  return {
    ...mapModuleEntityToDTO(moduleRecord),
    sections: moduleRecord.lessons.map((lesson): LessonDTO & { order: number; isPublished: boolean } => ({
      ...mapLessonEntityToDTO(lesson),
      order: lesson.displayOrder,
      isPublished: lesson.status === 'PUBLISHED',
    })),
  }
}
