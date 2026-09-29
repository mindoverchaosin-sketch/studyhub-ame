'use server'

import { requireApprovedRole } from '@/auth'
import { getSuperAdminDashboardData } from '@/server/services/super-admin-dashboard.service'

export async function getSuperAdminDashboardAction() {
  await requireApprovedRole('SUPER_ADMIN')
  return getSuperAdminDashboardData()
}