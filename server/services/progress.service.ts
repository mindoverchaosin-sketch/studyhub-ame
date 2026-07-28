import { progressRepository } from '@/server/repositories/progress.repository'
import { invalidateServiceCache } from '@/server/services/cache'

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
  const rows = await progressRepository.findProgressRowsByUser(studentId)

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
  const progress = await progressRepository.findTopicProgress(studentId, topicId)

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
  const rows = await progressRepository.findStudentProgressByCourse(studentId, courseId)

  return rows.map((row) => ({
    ...row,
    topicId: row.courseId,
    status: row.status,
    score: row.completionPercent,
  }))
}

export async function getStudentCompletedTopics(studentId: string): Promise<ProgressRow[]> {
  const rows = await progressRepository.findCompletedTopics(studentId)

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
    return await progressRepository.countQuizAttempts()
  } catch {
    return 0
  }
}

export async function upsertLessonProgress(userId: string, lessonId: string, data: any) {
  const result = await progressRepository.upsertLessonProgress(userId, lessonId, data)
  invalidateServiceCache('dashboard-summary', userId)
  invalidateServiceCache('study-planner', userId)
  invalidateServiceCache('progress-insights', userId)
  invalidateServiceCache('achievement-summary', userId)
  invalidateServiceCache('continue-learning', userId)
  invalidateServiceCache('goal-progress', userId)
  return result
}
