'use server'

import { requirePermission } from '@/auth'
import type { EnterpriseAnalyticsDashboardDTO } from '@/server/application/dto/analytics.dto'
import { analyticsService } from '@/server/services/analytics.service'

export async function getAnalyticsDashboardAction(): Promise<EnterpriseAnalyticsDashboardDTO> {
  await requirePermission('viewAnalytics')
  return analyticsService.getDashboard()
}
