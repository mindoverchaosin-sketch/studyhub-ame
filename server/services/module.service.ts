import prisma from '@/lib/prisma'
import { Module } from '@prisma/client'

/**
 * ModuleService
 * Handles module-related database operations
 */

export async function getModulesByCourse(courseId: string): Promise<Module[]> {
  return prisma.module.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    orderBy: { order: 'asc' },
  })
}

export async function getModuleBySlug(slug: string): Promise<Module | null> {
  return prisma.module.findUnique({
    where: { slug },
  })
}

export async function getModuleById(id: string): Promise<Module | null> {
  return prisma.module.findUnique({
    where: { id },
  })
}

export async function getModuleWithSections(id: string) {
  return prisma.module.findUnique({
    where: { id },
    include: {
      sections: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
      },
    },
  })
}
