import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { getAdaptiveLearningData } from '@/server/services/adaptive-learning.service'
import { invalidateServiceCache } from '@/server/services/cache'
import { getStudentProgress, getQuizAttemptCount } from '@/server/services/progress.service'
import * as examAttemptService from '@/server/services/exam-attempt.service'
import type { AdaptiveLearningDTO } from '@/server/services/adaptive-learning.service'
import type { ExamAnalyticsDTO, ReadinessDTO } from '@/server/application/dto/exam-analytics.dto'
import { NotFoundError } from '@/auth'
import { instrumentService } from '@/lib/logger'

export type ExamCompletionResult = {
  analytics: ExamAnalyticsDTO
  adaptive: AdaptiveLearningDTO
  updatedReviewQueue: Array<{ lessonId: string; title: string; status: string }>
  updatedSpacedRepetition: Array<{ lessonId: string; title: string; status: string }>
}

const completedAttemptCache = new Map<string, Promise<ExamCompletionResult>>()

export async function processCompletedAttempt(attemptId: string): Promise<ExamCompletionResult> {
  return instrumentService('ExamCompletionService', 'processCompletedAttempt', async () => {
    if (completedAttemptCache.has(attemptId)) {
      return completedAttemptCache.get(attemptId)!
    }

    const resultPromise = (async () => {
      const baseAnalytics = await examAttemptService.calculateExamAnalytics(attemptId)
      const attempt = await examAttemptRepository.loadAttemptWithRelations(attemptId)
      if (!attempt) throw new NotFoundError('Attempt not found.')

      const studentId = attempt.studentId
      const adaptive = await getAdaptiveLearningData(studentId)
      const readiness = await calculateReadinessScore(studentId, adaptive)

      const analytics: ExamAnalyticsDTO = {
        ...baseAnalytics,
        readiness,
      }

      const processedLessons = new Set<string>()
      const progressRows = await progressRepository.findLessonProgressByUser(studentId)
      const updatedReviewQueue = await updateReviewQueue(studentId, analytics.topicAnalytics.weakTopics, processedLessons, progressRows)
      const updatedSpacedRepetition = await updateSpacedRepetition(studentId, analytics.topicAnalytics.weakTopics, processedLessons, progressRows)
      invalidateServiceCache('dashboard-summary', studentId)
      invalidateServiceCache('study-planner', studentId)
      invalidateServiceCache('progress-insights', studentId)
      invalidateServiceCache('achievement-summary', studentId)
      invalidateServiceCache('continue-learning', studentId)
      invalidateServiceCache('goal-progress', studentId)

      return {
        analytics,
        adaptive,
        updatedReviewQueue,
        updatedSpacedRepetition,
      }
    })()

    completedAttemptCache.set(attemptId, resultPromise)

    try {
      return await resultPromise
    } catch (error) {
      completedAttemptCache.delete(attemptId)
      throw error
    }
  })
}

async function updateReviewQueue(studentId: string, weakTopics: string[], processedLessons: Set<string> = new Set(), progressRowsParam?: any[]) {
  if (!weakTopics.length) return []

  try {
    const progressRows: any[] = progressRowsParam ?? (await progressRepository.findLessonProgressByUser(studentId))
    const matches = progressRows.filter((row) => {
      const title = row.lesson?.title ?? ''
      return weakTopics.some((topic) => title.toLowerCase().includes(topic.toLowerCase()))
    })

    const updates = await Promise.all(
      matches.map(async (row) => {
        if (processedLessons.has(row.lesson?.id)) {
          return { lessonId: row.lesson?.id ?? 'unknown', title: row.lesson?.title ?? 'Lesson', status: 'skipped' }
        }
        try {
          const updated = await progressRepository.upsertLessonProgress(row.userId, row.lesson.id, {
            status: 'IN_PROGRESS',
            percentComplete: Math.max(row.percentComplete ?? 0, 30),
          })
          processedLessons.add(row.lesson.id)
          return {
            lessonId: row.lesson.id,
            title: row.lesson.title ?? 'Lesson',
            status: updated.status,
          }
        } catch (e) {
          processedLessons.add(row.lesson?.id ?? 'unknown')
          return { lessonId: row.lesson?.id ?? 'unknown', title: row.lesson?.title ?? 'Lesson', status: 'error' }
        }
      }),
    )

    return updates
  } catch (e) {
    return []
  }
}

async function updateSpacedRepetition(studentId: string, weakTopics: string[], processedLessons: Set<string> = new Set(), progressRowsParam?: any[]) {
  if (!weakTopics.length) return []

  try {
    const progressRows: any[] = progressRowsParam ?? (await progressRepository.findLessonProgressByUser(studentId))
    const dueRows = progressRows
      .filter((row) => {
        const title = row.lesson?.title ?? ''
        return weakTopics.some((topic) => title.toLowerCase().includes(topic.toLowerCase()))
      })
      .slice(0, 3)

    const updates = await Promise.all(
      dueRows.map(async (row) => {
        if (processedLessons.has(row.lesson?.id)) {
          return { lessonId: row.lesson?.id ?? 'unknown', title: row.lesson?.title ?? 'Lesson', status: 'skipped' }
        }
        try {
          const updated = await progressRepository.upsertLessonProgress(row.userId, row.lesson.id, {
            status: 'IN_PROGRESS',
            percentComplete: Math.min(Math.max(row.percentComplete ?? 0, 20), 70),
          })
          processedLessons.add(row.lesson.id)
          return {
            lessonId: row.lesson.id,
            title: row.lesson.title ?? 'Lesson',
            status: updated.status,
          }
        } catch (e) {
          processedLessons.add(row.lesson?.id ?? 'unknown')
          return { lessonId: row.lesson?.id ?? 'unknown', title: row.lesson?.title ?? 'Lesson', status: 'error' }
        }
      }),
    )

    return updates
  } catch (e) {
    return []
  }
}

async function calculateReadinessScore(studentId: string, adaptive: AdaptiveLearningDTO | null): Promise<ReadinessDTO> {
  const effectiveAdaptive = adaptive ?? ({ performanceSummary: { recentAccuracy: 0, weakTopics: [], improvedTopics: [] } } as any)
  const progressRows = await getStudentProgress(studentId)
  const quizAttempts = await getQuizAttemptCount()

  const recentExamScore = effectiveAdaptive.performanceSummary?.recentAccuracy ?? 0
  const adaptiveAccuracy = effectiveAdaptive.performanceSummary?.recentAccuracy ?? 0
  const topicMastery = progressRows.length > 0 ? Math.round(progressRows.reduce((sum, item) => sum + (item.score ?? 0), 0) / progressRows.length) : 0
  const revisionCompletion = Math.max(0, Math.min(100, Math.round((quizAttempts / Math.max(1, progressRows.length)) * 10)))

  const readinessPercentage = Math.round((recentExamScore * 0.4) + (topicMastery * 0.3) + ((100 - (effectiveAdaptive.performanceSummary?.weakTopics?.length ?? 0) * 10) * 0.2) + (revisionCompletion * 0.1))
  const confidence = readinessPercentage >= 80 ? 'High' : readinessPercentage >= 50 ? 'Moderate' : 'Low'

  return {
    readinessPercentage,
    confidence,
    nextActions: [
      'Review missed topics in your adaptive learning page',
      'Revisit weak questions and concepts',
      'Practice a short mock quiz to lock in progress',
    ],
    recentExamScore,
    adaptiveAccuracy,
    topicMastery,
    revisionCompletion,
  }
}
