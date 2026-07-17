import prisma from '@/lib/prisma'
import { Quiz } from '@prisma/client'

/**
 * QuizService
 * Handles quiz-related database operations
 */

export async function getQuizByTopic(topicId: string): Promise<Quiz | null> {
  return prisma.quiz.findFirst({
    where: {
      topicId,
      isPublished: true,
    },
  })
}

export async function getQuizById(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
  })
}

export async function getQuizWithQuestions(id: string) {
  return prisma.quiz.findUnique({
    where: { id },
    include: {
      quizQuestions: {
        include: {
          question: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function getPublishedQuizzes(): Promise<Quiz[]> {
  return prisma.quiz.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getQuizCount(): Promise<number> {
  return prisma.quiz.count()
}
