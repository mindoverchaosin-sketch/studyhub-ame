import type { CourseWithModuleCountEntity } from '../../infrastructure/entities/course.entity'
import type { CourseDTO } from '../dto/course.dto'

export function mapCourseEntityToDTO(course: CourseWithModuleCountEntity): CourseDTO {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    isPremium: Boolean(course.isPremium),
    categoryId: course.categoryId,
    status: course.status,
    publishedAt: course.publishedAt,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    _count: '_count' in course ? course._count : undefined,
  }
}
