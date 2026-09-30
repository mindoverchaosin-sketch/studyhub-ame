import type { CourseDTO } from '@/server/application/dto/course.dto'
import { courseRepository } from '@/server/repositories/course.repository'
import { mapCourseEntityToDTO } from '@/server/application/mappers/course.mapper'

/**
 * CourseService
 * Handles course-related database operations
 */

export async function getAllCourses(): Promise<CourseDTO[]> {
  return (await courseRepository.findAllPublished()).map(mapCourseEntityToDTO)
}

export async function getAdminCourses(): Promise<CourseDTO[]> {
  return (await courseRepository.findAll()).map(mapCourseEntityToDTO)
}

export async function getCourseBySlug(slug: string): Promise<CourseDTO | null> {
  const course = await courseRepository.findBySlug(slug)
  return course ? mapCourseEntityToDTO(course) : null
}

export async function getCourseById(id: string): Promise<CourseDTO | null> {
  const course = await courseRepository.findById(id)
  return course ? mapCourseEntityToDTO(course) : null
}

export async function getAdminCourseById(id: string) {
  const course = await courseRepository.findAdminById(id)
  if (!course || course.deletedAt) return null

  return {
    ...mapCourseEntityToDTO(course),
    categoryTitle: course.category?.title ?? null,
    modules: course.modules,
  }
}

export async function updateAdminCourseById(id: string, input: Pick<CourseDTO, 'title' | 'slug' | 'description'>): Promise<CourseDTO | null> {
  const existing = await courseRepository.findById(id)
  if (!existing || existing.deletedAt) return null

  const updated = await courseRepository.update(id, {
    title: input.title,
    slug: input.slug,
    description: input.description,
  })

  return mapCourseEntityToDTO(updated)
}

export async function getCoursesByExamType(_examType: string): Promise<CourseDTO[]> {
  void _examType
  return (await courseRepository.findAllPublished()).map(mapCourseEntityToDTO)
}
