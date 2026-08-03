'use server'

import { requireStudent, requireOwnership } from '@/auth'
import { getDashboardSummary, getStudentDashboardData } from '@/server/services/dashboard.service'
import type { DashboardDTO, DashboardSummaryDTO } from '@/server/application/dto/dashboard.dto'

export async function getDashboardSummaryAction(studentId: string): Promise<DashboardSummaryDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id)

  return getDashboardSummary(studentId)
}

export async function getStudentDashboardDataAction(studentId: string): Promise<DashboardDTO> {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id)

  return getStudentDashboardData(studentId)
}
