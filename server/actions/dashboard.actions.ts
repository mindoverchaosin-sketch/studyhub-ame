'use server'

import { requireStudent, requireOwnership } from '@/auth'
import { getDashboardSummary } from '@/server/services/dashboard.service'
import type { DashboardSummaryDTO } from '@/server/application/dto/dashboard.dto'

export async function getDashboardSummaryAction(studentId: string): Promise<DashboardSummaryDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id)

  return getDashboardSummary(studentId)
}
