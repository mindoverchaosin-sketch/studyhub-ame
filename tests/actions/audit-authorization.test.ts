import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermissionMock = vi.hoisted(() => vi.fn())
const listAuditLogsMock = vi.hoisted(() => vi.fn())

vi.mock('../../lib/auth', () => ({
  requirePermission: requirePermissionMock,
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message = 'Access denied.') {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = 'Authentication required.') {
      super(message)
      this.name = 'UnauthorizedError'
    }
  },
}))

vi.mock('../../server/services/audit-log.service', () => ({
  auditLogService: {
    listAuditLogs: listAuditLogsMock,
  },
}))

import { getAuditLogsAction } from '../../server/actions/audit.actions'

describe('audit authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires the audit log permission before loading logs', async () => {
    requirePermissionMock.mockResolvedValue(undefined)
    listAuditLogsMock.mockResolvedValue({ auditLogs: [], total: 0 })

    await expect(getAuditLogsAction({ page: 1, pageSize: 20 })).resolves.toEqual({ auditLogs: [], total: 0 })
    expect(requirePermissionMock).toHaveBeenCalledWith('manageAuditLogs')
  })
})
