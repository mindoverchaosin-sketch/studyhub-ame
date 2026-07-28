import { beforeEach, describe, expect, it, vi } from 'vitest'

const recordEventMock = vi.hoisted(() => vi.fn())
const listAuditLogsMock = vi.hoisted(() => vi.fn())

vi.mock('@/server/repositories/audit.repository', () => ({
  auditRepository: {
    recordEvent: recordEventMock,
    listAuditLogs: listAuditLogsMock,
  },
}))

import { AuditLogService } from '../../server/services/audit-log.service'

describe('AuditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a normalized audit event with actor metadata and status', async () => {
    const service = new AuditLogService()
    recordEventMock.mockResolvedValue({ id: 'audit-1' })

    const result = await service.recordEvent({
      actorId: 'user-1',
      actorRole: 'SUPER_ADMIN',
      action: 'module.create',
      entityType: 'MODULE',
      entityId: 'module-1',
      success: true,
      metadata: { source: 'server-action' },
    })

    expect(recordEventMock).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: 'user-1',
      action: 'module.create',
      targetType: 'MODULE',
      targetId: 'module-1',
      metadata: expect.objectContaining({
        success: true,
        actorRole: 'SUPER_ADMIN',
        source: 'server-action',
      }),
    }))
    expect(result).toEqual({ id: 'audit-1' })
  })

  it('returns audit logs in descending timestamp order', async () => {
    const service = new AuditLogService()
    listAuditLogsMock.mockResolvedValue({
      auditLogs: [{
        id: 'a-2',
        timestamp: '2026-01-02T00:00:00.000Z',
        userId: 'user-2',
        userRole: 'SUPER_ADMIN',
        action: 'module.create',
        entityType: 'MODULE',
        entityId: 'module-2',
        status: 'SUCCESS',
        metadata: { success: true, actorRole: 'SUPER_ADMIN' },
      }, {
        id: 'a-1',
        timestamp: '2026-01-01T00:00:00.000Z',
        userId: 'user-1',
        userRole: 'ADMIN',
        action: 'module.update',
        entityType: 'MODULE',
        entityId: 'module-1',
        status: 'FAILURE',
        metadata: { success: false, actorRole: 'ADMIN' },
      }],
      total: 2,
    })

    const result = await service.listAuditLogs({ page: 1, pageSize: 20 })

    expect(result.auditLogs[0]).toMatchObject({ id: 'a-2', status: 'SUCCESS' })
    expect(result.auditLogs[1]).toMatchObject({ id: 'a-1', status: 'FAILURE' })
    expect(result.total).toBe(2)
  })
})
