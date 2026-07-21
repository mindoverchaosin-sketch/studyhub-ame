import type { LessonEntity } from '../../infrastructure/entities/lesson.entity'
import type { LessonDTO } from '../dto/lesson.dto'

export function mapLessonEntityToDTO(lesson: LessonEntity): LessonDTO {
  return {
    id: lesson.id,
    moduleId: lesson.moduleId,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    durationMinutes: lesson.durationMinutes,
    displayOrder: lesson.displayOrder,
    status: lesson.status,
    publishedAt: lesson.publishedAt,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  }
}
