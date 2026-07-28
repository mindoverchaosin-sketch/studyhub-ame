'use server'

import { requireStudent, requireOwnership } from '@/auth'
import { getAchievements } from '@/server/services/achievement.service'
import type { AchievementSummaryDTO } from '@/server/application/dto/achievement.dto'

export async function getAchievementsAction(studentId: string): Promise<AchievementSummaryDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id, true, session.user.role)
  return getAchievements(studentId)
}
