import type { GoalTrackingDTO } from '@/server/application/dto/goal-tracking.dto'
import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { getCacheKey, invalidateServiceCache, withServiceCache } from '@/server/services/cache'

const DEFAULT_GOALS = {
  dailyQuestionGoal: 20,
  weeklyStudyGoalMinutes: 240,
  weeklyMockGoal: 2,
  moduleCompletionGoal: 4,
}

export async function getGoalProgress(studentId: string): Promise<GoalTrackingDTO> {
  const cacheKey = getCacheKey('goal-progress', studentId)
  return withServiceCache(cacheKey, 90_000, async () => {
    try {
      const [moduleProgressRows, attempts] = await Promise.all([
      progressRepository.findModuleProgressByUser(studentId),
      examAttemptRepository.listAttempts(studentId),
    ])

    const modulesCompleted = moduleProgressRows.filter((entry: any) => (entry.percentComplete ?? 0) >= 100).length
    const weeklyMocksCompleted = attempts.filter((attempt: any) => attempt.status === 'SUBMITTED').length
    const weeklyStudyMinutesCompleted = Math.max(0, modulesCompleted * 30 + weeklyMocksCompleted * 20)
    const completionPercentage = Math.min(100, Math.round((modulesCompleted / DEFAULT_GOALS.moduleCompletionGoal) * 100))

      return {
        dailyQuestionGoal: DEFAULT_GOALS.dailyQuestionGoal,
        questionsCompletedToday: Math.min(DEFAULT_GOALS.dailyQuestionGoal, Math.max(0, modulesCompleted)),
        weeklyStudyGoalMinutes: DEFAULT_GOALS.weeklyStudyGoalMinutes,
        weeklyStudyMinutesCompleted,
        weeklyMockGoal: DEFAULT_GOALS.weeklyMockGoal,
        weeklyMocksCompleted,
        moduleCompletionGoal: DEFAULT_GOALS.moduleCompletionGoal,
        modulesCompleted,
        completionPercentage,
      }
    } catch {
      return {
        dailyQuestionGoal: DEFAULT_GOALS.dailyQuestionGoal,
        questionsCompletedToday: 0,
        weeklyStudyGoalMinutes: DEFAULT_GOALS.weeklyStudyGoalMinutes,
        weeklyStudyMinutesCompleted: 0,
        weeklyMockGoal: DEFAULT_GOALS.weeklyMockGoal,
        weeklyMocksCompleted: 0,
        moduleCompletionGoal: DEFAULT_GOALS.moduleCompletionGoal,
        modulesCompleted: 0,
        completionPercentage: 0,
      }
    }
  })
}

export async function updateGoals(studentId: string, goals: Partial<GoalTrackingDTO>): Promise<GoalTrackingDTO> {
  const current = await getGoalProgress(studentId)
  const next = {
    ...current,
    ...goals,
  }

  invalidateServiceCache('goal-progress', studentId)
  return next
}
