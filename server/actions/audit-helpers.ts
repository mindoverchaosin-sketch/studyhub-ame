import { requirePermission } from '@/auth'
import { auditLogService } from '@/server/services/audit-log.service'

export async function withAuditLogging<T>(params: {
  permission: string
  action: string
  entityType: string
  entityId?: string | null
  metadata?: Record<string, unknown>
  run: () => Promise<T>
}): Promise<T> {
  const session = await requirePermission(params.permission)
  const actorId = session.user.id ?? 'unknown'
  const actorRole = session.user.role ?? null

  try {
    const result = await params.run()
    const resolvedEntityId = params.entityId ?? (typeof result === 'object' && result && 'id' in result && typeof (result as { id?: unknown }).id === 'string' ? (result as { id: string }).id : null)

    await auditLogService.recordEvent({
      actorId,
      actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: resolvedEntityId,
      success: true,
      metadata: { source: 'server-action', ...(params.metadata ?? {}) },
    })

    return result
  } catch (error) {
    await auditLogService.recordEvent({
      actorId,
      actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      success: false,
      metadata: { source: 'server-action', ...(params.metadata ?? {}), error: error instanceof Error ? error.message : 'Unknown error' },
    })

    throw error
  }
}
