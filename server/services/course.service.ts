import prisma from '@/lib/prisma'
import { Course, ExamType } from '@prisma/client'

/**
 * CourseService
 * Handles course-related database operations
 */

export async function getAllCourses(): Promise<Course[]> {
  return prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAdminCourses(): Promise<(Course & { _count: { modules: number } })[]> {
  return prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          modules: true,
        },
      },
    },
  })
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return prisma.course.findUnique({
    where: { slug },
  })
}

export async function getCourseById(id: string): Promise<Course | null> {
  return prisma.course.findUnique({
    where: { id },
  })
}

export async function getCoursesByExamType(examType: ExamType): Promise<Course[]> {
  return prisma.course.findMany({
    where: {
      examType,
      isPublished: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
