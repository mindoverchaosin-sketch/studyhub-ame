import type { CourseEntity, CourseWithModuleCountEntity } from '../../infrastructure/entities/course.entity'
import type { CourseDTO } from '../dto/course.dto'

export function mapCourseEntityToDTO(course: any): CourseDTO {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    categoryId: course.categoryId,
    status: course.status,
    publishedAt: course.publishedAt,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    _count: '_count' in course ? course._count : undefined,
  }
}
