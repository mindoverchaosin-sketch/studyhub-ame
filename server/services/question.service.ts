import prisma from '@/lib/prisma'
import { Question } from '@prisma/client'

/**
 * QuestionService
 * Handles question-related database operations
 */

export async function getQuestionsByTopic(topicId: string): Promise<Question[]> {
  return prisma.question.findMany({
    where: { topicId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getQuestionByTopic(topicId: string): Promise<Question | null> {
  return prisma.question.findFirst({
    where: { topicId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getQuestionCount(): Promise<number> {
  return prisma.question.count()
}
