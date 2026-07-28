import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermissionMock = vi.hoisted(() => vi.fn())

vi.mock('@/auth', () => ({
  requirePermission: requirePermissionMock,
}))

vi.mock('@/server/services/subscription-management.service', () => ({
  subscriptionManagementService: {
    getSubscriptions: vi.fn().mockResolvedValue({ subscriptions: [], total: 0 }),
    getSubscription: vi.fn().mockResolvedValue(null),
    upgradeSubscription: vi.fn(),
    downgradeSubscription: vi.fn(),
    pauseSubscription: vi.fn(),
    resumeSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    expireSubscription: vi.fn(),
    renewSubscription: vi.fn(),
  },
}))

import { getSubscriptions, getSubscription } from '@/server/actions/billing.actions'

describe('billing subscription authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires manageBilling to list subscriptions', async () => {
    requirePermissionMock.mockResolvedValue(undefined)

    await expect(getSubscriptions()).resolves.toEqual({ subscriptions: [], total: 0 })
    expect(requirePermissionMock).toHaveBeenCalledWith('manageBilling')
  })

  it('requires manageBilling to view a subscription', async () => {
    requirePermissionMock.mockResolvedValue(undefined)

    await expect(getSubscription('sub-1')).resolves.toBeNull()
    expect(requirePermissionMock).toHaveBeenCalledWith('manageBilling')
  })
})
