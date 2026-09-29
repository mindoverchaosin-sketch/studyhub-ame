import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequireApprovedRole, mockGetDashboardData } = vi.hoisted(() => ({
  mockRequireApprovedRole: vi.fn(),
  mockGetDashboardData: vi.fn(),
}))

vi.mock('@/auth', () => ({ requireApprovedRole: mockRequireApprovedRole }))
vi.mock('@/server/services/super-admin-dashboard.service', () => ({ getSuperAdminDashboardData: mockGetDashboardData }))

describe('Super Admin dashboard action authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires SUPER_ADMIN before loading protected metrics', async () => {
    mockRequireApprovedRole.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockGetDashboardData.mockResolvedValue({ metrics: { totalUsers: 9 } })
    const { getSuperAdminDashboardAction } = await import('@/server/actions/super-admin-dashboard.actions')

    await expect(getSuperAdminDashboardAction()).resolves.toEqual({ metrics: { totalUsers: 9 } })
    expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
    expect(mockGetDashboardData).toHaveBeenCalledOnce()
  })

  it.each(['STUDENT', 'CONTENT_EDITOR', 'ADMIN', 'UNAUTHENTICATED'])('does not load protected metrics for %s', async () => {
    mockRequireApprovedRole.mockRejectedValue(new Error('Access denied.'))
    const { getSuperAdminDashboardAction } = await import('@/server/actions/super-admin-dashboard.actions')

    await expect(getSuperAdminDashboardAction()).rejects.toThrow('Access denied.')
    expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
    expect(mockGetDashboardData).not.toHaveBeenCalled()
  })
})