'use server'

import { requireStudent, requireOwnership } from '@/auth'
import { getProgressInsights } from '@/server/services/progress-insights.service'
import { getGoalProgress, updateGoals } from '@/server/services/goal-tracking.service'
import type { GoalTrackingDTO } from '@/server/application/dto/goal-tracking.dto'
import type { ProgressInsightsDTO } from '@/server/application/dto/progress-insights.dto'

export async function getProgressInsightsAction(studentId: string): Promise<ProgressInsightsDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)
  return getProgressInsights(studentId)
}

export async function getGoalProgressAction(studentId: string): Promise<GoalTrackingDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)
  return getGoalProgress(studentId)
}

export async function updateGoalProgressAction(studentId: string, goals: Partial<GoalTrackingDTO>): Promise<GoalTrackingDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)
  return updateGoals(studentId, goals)
}
