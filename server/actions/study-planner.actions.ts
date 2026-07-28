'use server'

import { requireStudent, requireOwnership } from '@/auth'
import { generateDailyPlan } from '@/server/services/study-planner.service'
import { getContinueLearning } from '@/server/services/continue-learning.service'
import type { ContinueLearningDTO, StudyPlannerDTO } from '@/server/application/dto/study-planner.dto'

export async function generateDailyPlanAction(studentId: string): Promise<StudyPlannerDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)
  return generateDailyPlan(studentId)
}

export async function getContinueLearningAction(studentId: string): Promise<ContinueLearningDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)
  return getContinueLearning(studentId)
}
