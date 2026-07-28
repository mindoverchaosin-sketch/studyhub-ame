import { auditRepository } from '@/server/repositories/audit.repository'
import type { AuditLogEntryDTO, AuditLogListDTO, AuditLogQueryDTO } from '@/server/application/dto/audit.dto'

type RecordAuditEventInput = {
  actorId: string
  actorRole?: string | null
  action: string
  entityType: string
  entityId?: string | null
  success?: boolean
  metadata?: Record<string, unknown> | null
}

export class AuditLogService {
  async recordEvent(input: RecordAuditEventInput) {
    return auditRepository.recordEvent({
      actorUserId: input.actorId,
      action: input.action,
      targetType: input.entityType,
      targetId: input.entityId ?? 'unknown',
      metadata: {
        success: input.success ?? true,
        actorRole: input.actorRole ?? null,
        ...(input.metadata ?? {}),
      },
    })
  }

  async listAuditLogs(params: AuditLogQueryDTO = {}): Promise<AuditLogListDTO> {
    return auditRepository.listAuditLogs(params)
  }
}

export const auditLogService = new AuditLogService()
