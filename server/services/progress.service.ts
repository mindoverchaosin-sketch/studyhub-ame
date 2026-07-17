import prisma from '@/lib/prisma'
import { TopicProgress } from '@prisma/client'

/**
 * ProgressService
 * Handles student progress tracking database operations
 */

export async function getStudentProgress(studentId: string): Promise<TopicProgress[]> {
  return prisma.topicProgress.findMany({
    where: { studentId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getTopicProgress(
  studentId: string,
  topicId: string
): Promise<TopicProgress | null> {
  return prisma.topicProgress.findUnique({
    where: {
      studentId_topicId: {
        studentId,
        topicId,
      },
    },
  })
}

export async function getStudentProgressByCourse(
  studentId: string,
  courseId: string
) {
  return prisma.topicProgress.findMany({
    where: {
      student: {
        id: studentId,
      },
      topic: {
        section: {
          module: {
            courseId,
          },
        },
      },
    },
    include: {
      topic: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getStudentCompletedTopics(studentId: string): Promise<TopicProgress[]> {
  return prisma.topicProgress.findMany({
    where: {
      studentId,
      status: 'COMPLETED',
    },
    orderBy: { completedAt: 'desc' },
  })
}

export async function getQuizAttemptCount(): Promise<number> {
  return prisma.topicProgress.count()
}
