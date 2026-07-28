import type { StudyPlannerDTO } from '@/server/application/dto/study-planner.dto'
import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { getAdaptiveLearningData } from '@/server/services/adaptive-learning.service'
import { getCacheKey, withServiceCache } from '@/server/services/cache'
import { instrumentService } from '@/lib/logger'

export async function generateDailyPlan(studentId: string): Promise<StudyPlannerDTO> {
  const cacheKey = getCacheKey('study-planner', studentId)
  return instrumentService('StudyPlannerService', 'generateDailyPlan', async () => {
    return withServiceCache(cacheKey, 90_000, async () => {
      try {
        const [lessonProgressRows, moduleProgressRows, adaptiveData, attempts] = await Promise.all([
          progressRepository.findLessonProgressByUser(studentId),
          progressRepository.findModuleProgressByUser(studentId),
          getAdaptiveLearningData(studentId),
          examAttemptRepository.listAttempts(studentId),
        ])

        const weakTopics = adaptiveData?.performanceSummary?.weakTopics ?? []
        const reviewQueue = adaptiveData?.reviewQueue ?? []
        const recommendations = adaptiveData?.recommendations ?? []
        const recentAttempts = attempts.filter((attempt: any) => attempt.status === 'SUBMITTED')

    const revisionTasks = reviewQueue.length > 0
      ? reviewQueue.slice(0, 2).map((item: any, index: number) => ({
          id: `revision-${index}`,
          title: item.title ?? 'Review topic',
          detail: item.detail ?? 'Refresh the weak area before your next session.',
        }))
      : lessonProgressRows.slice(0, 2).map((entry: any, index: number) => ({
          id: `revision-${index}`,
          title: entry.lesson?.title ?? 'Review latest lesson',
          detail: 'Revisit this topic to strengthen retention.',
        }))

    const practiceTasks = recommendations.length > 0
      ? recommendations.slice(0, 2).map((item: any, index: number) => ({
          id: `practice-${index}`,
          title: item.title ?? 'Practice session',
          detail: item.detail ?? 'Keep momentum going with a short practice block.',
        }))
      : lessonProgressRows.slice(0, 2).map((entry: any, index: number) => ({
          id: `practice-${index}`,
          title: `Practice ${entry.lesson?.title ?? 'your latest lesson'}`,
          detail: 'Use a short practice burst to consolidate understanding.',
        }))

    const weakTopicTasks = weakTopics.length > 0
      ? weakTopics.slice(0, 3).map((topic: string, index: number) => ({
          id: `weak-${index}`,
          title: topic,
          detail: 'Focus on this topic to improve confidence.',
        }))
      : lessonProgressRows.slice(0, 3).map((entry: any, index: number) => ({
          id: `weak-${index}`,
          title: entry.lesson?.title ?? 'Review weak topic',
          detail: 'Spend a short block on this topic to strengthen recall.',
        }))

    const mockExamTask = recentAttempts.length > 0
      ? {
          id: 'mock-exam-recommendation',
          title: 'Take a mock exam',
          detail: `Your latest score was ${recentAttempts[0].percentage ?? 0}% — use this to benchmark progress.`,
        }
      : lessonProgressRows.length > 0
        ? {
            id: 'mock-exam-recommendation',
            title: 'Take a mock exam',
            detail: 'Use a short mock exam to check retention before your next study block.',
          }
        : null

    const lessonMinutes = lessonProgressRows.reduce((sum: number, entry: any) => sum + (entry.percentComplete ?? 0) / 10, 0)
    const moduleMinutes = moduleProgressRows.reduce((sum: number, entry: any) => sum + (entry.percentComplete ?? 0) / 5, 0)
    const estimatedStudyMinutes = Math.max(0, Math.round(lessonMinutes + moduleMinutes + (weakTopicTasks.length * 10)))

      return {
        estimatedStudyMinutes,
        revisionTasks,
        practiceTasks,
        mockExamTask,
        weakTopicTasks,
        generatedAt: new Date().toISOString(),
      }
    } catch {
      return {
        estimatedStudyMinutes: 0,
        revisionTasks: [],
        practiceTasks: [],
        mockExamTask: null,
        weakTopicTasks: [],
        generatedAt: new Date().toISOString(),
      }
    }
  })
})
}
