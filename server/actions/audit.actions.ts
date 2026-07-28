'use server'

import { requirePermission } from '@/auth'
import { auditLogService } from '@/server/services/audit-log.service'

export async function getAuditLogsAction(params: { search?: string; userId?: string; action?: string; entityType?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) {
  await requirePermission('manageAuditLogs')
  return auditLogService.listAuditLogs(params)
}
