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

export async function getCoursesByExamType(_examType: string): Promise<CourseDTO[]> {
  return (await courseRepository.findAllPublished()).map(mapCourseEntityToDTO)
}
