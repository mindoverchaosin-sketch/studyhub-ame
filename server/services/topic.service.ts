import prisma from '@/lib/prisma'
import { Topic } from '@prisma/client'

/**
 * TopicService
 * Handles topic-related database operations
 */

export async function getTopicsBySection(sectionId: string): Promise<Topic[]> {
  return prisma.topic.findMany({
    where: {
      sectionId,
      isPublished: true,
    },
    orderBy: { order: 'asc' },
  })
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  return prisma.topic.findUnique({
    where: { slug },
  })
}

export async function getTopicById(id: string): Promise<Topic | null> {
  return prisma.topic.findUnique({
    where: { id },
  })
}

export async function getTopicCount(): Promise<number> {
  return prisma.topic.count()
}

export async function getTopicWithResources(id: string) {
  return prisma.topic.findUnique({
    where: { id },
    include: {
      resources: {
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function getTopicWithQuestions(id: string) {
  return prisma.topic.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}
