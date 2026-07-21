import type { Course } from '@prisma/client'

export type CourseEntity = Course
export type CourseWithModuleCountEntity = Course & {
  _count?: {
    modules: number
  }
}
