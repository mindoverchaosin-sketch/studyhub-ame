'use server'

import { requirePermission } from '@/auth'
import { getAdminDashboardSummary } from '@/server/services/admin-dashboard.service'
import type { AdminDashboardDTO } from '@/server/application/dto/admin-dashboard.dto'

export async function getDashboardSummaryAction(): Promise<AdminDashboardDTO> {
  await requirePermission('viewAnalytics')
  return getAdminDashboardSummary()
}
