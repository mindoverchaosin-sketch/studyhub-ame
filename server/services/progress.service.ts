import prisma from '@/lib/prisma'

type ProgressRow = {
  id: string
  userId: string
  topicId: string
  status: string
  score: number | null
  completedAt: Date | null
  lastVisitedAt: Date | null
  timeSpentMinutes: number
  updatedAt: Date
  createdAt: Date
}

/**
 * ProgressService
 * Handles student progress tracking database operations
 */

export async function getStudentProgress(studentId: string): Promise<ProgressRow[]> {
  const rows = await prisma.progress.findMany({
    where: { userId: studentId },
    orderBy: { updatedAt: 'desc' },
  })

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    topicId: row.courseId,
    status: row.status,
    score: row.completionPercent,
    completedAt: row.createdAt,
    lastVisitedAt: row.updatedAt,
    timeSpentMinutes: 0,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  }))
}

export async function getTopicProgress(studentId: string, topicId: string): Promise<ProgressRow | null> {
  const progress = await prisma.lessonProgress.findFirst({
    where: {
      userId: studentId,
      lessonId: topicId,
    },
  })

  if (!progress) {
    return null
  }

  return {
    id: progress.id,
    userId: progress.userId,
    topicId,
    status: progress.status,
    score: progress.percentComplete,
    completedAt: progress.createdAt,
    lastVisitedAt: progress.updatedAt,
    timeSpentMinutes: 0,
    updatedAt: progress.updatedAt,
    createdAt: progress.createdAt,
  }
}

export async function getStudentProgressByCourse(studentId: string, courseId: string) {
  const rows = await prisma.progress.findMany({
    where: {
      userId: studentId,
      courseId,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return rows.map((row) => ({
    ...row,
    topicId: row.courseId,
    status: row.status,
    score: row.completionPercent,
  }))
}

export async function getStudentCompletedTopics(studentId: string): Promise<ProgressRow[]> {
  const rows = await prisma.progress.findMany({
    where: {
      userId: studentId,
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    topicId: row.courseId,
    status: row.status,
    score: row.completionPercent,
    completedAt: row.createdAt,
    lastVisitedAt: row.updatedAt,
    timeSpentMinutes: 0,
    updatedAt: row.updatedAt,
    createdAt: row.createdAt,
  }))
}

export async function getQuizAttemptCount(): Promise<number> {
  try {
    return await prisma.quizAttempt.count()
  } catch {
    return 0
  }
}
