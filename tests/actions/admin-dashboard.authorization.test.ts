import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireApprovedRoleMock = vi.fn()
const requirePermissionMock = vi.fn()

vi.mock('@/auth', () => ({
  requireApprovedRole: requireApprovedRoleMock,
  requirePermission: requirePermissionMock,
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = 'Authentication required.') {
      super(message)
      this.name = 'UnauthorizedError'
      ;(this as any).status = 401
    }
  },
}))

const getAdminDashboardSummaryMock = vi.fn()
vi.mock('@/server/services/admin-dashboard.service', () => ({
  getAdminDashboardSummary: getAdminDashboardSummaryMock,
}))

describe('admin dashboard authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires permission for the dashboard summary action', async () => {
    requireApprovedRoleMock.mockResolvedValue(undefined)
    getAdminDashboardSummaryMock.mockResolvedValue({ health: { status: 'healthy' } })

    const { getDashboardSummaryAction } = await import('../../server/actions/admin-dashboard.actions')
    await expect(getDashboardSummaryAction()).resolves.toBeDefined()
    expect(getAdminDashboardSummaryMock).toHaveBeenCalled()
    expect(requireApprovedRoleMock).toHaveBeenCalledWith('ADMIN')
  })
})
