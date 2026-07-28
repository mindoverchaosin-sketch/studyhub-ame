export type AuditLogStatus = 'SUCCESS' | 'FAILURE'

export type AuditLogEntryDTO = {
  id: string
  timestamp: string
  userId: string
  userRole: string | null
  action: string
  entityType: string
  entityId: string | null
  status: AuditLogStatus
  metadata?: Record<string, unknown> | null
}

export type AuditLogListDTO = {
  auditLogs: AuditLogEntryDTO[]
  total: number
}

export type AuditLogQueryDTO = {
  search?: string
  userId?: string
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}
