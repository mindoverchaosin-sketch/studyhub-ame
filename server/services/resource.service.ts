import prisma from '@/lib/prisma'
import { Resource, ResourceType } from '@prisma/client'

/**
 * ResourceService
 * Handles resource-related database operations
 */

export async function getResourcesByTopic(topicId: string): Promise<Resource[]> {
  return prisma.resource.findMany({
    where: { topicId },
    orderBy: { order: 'asc' },
  })
}

export async function getResourceById(id: string): Promise<Resource | null> {
  return prisma.resource.findUnique({
    where: { id },
  })
}

export async function getResourcesByType(topicId: string, type: ResourceType): Promise<Resource[]> {
  return prisma.resource.findMany({
    where: {
      topicId,
      type,
    },
    orderBy: { order: 'asc' },
  })
}

export async function getPremiumResourcesByTopic(topicId: string): Promise<Resource[]> {
  return prisma.resource.findMany({
    where: {
      topicId,
      isPremium: true,
    },
    orderBy: { order: 'asc' },
  })
}

export async function getResourceCount(): Promise<number> {
  return prisma.resource.count()
}
