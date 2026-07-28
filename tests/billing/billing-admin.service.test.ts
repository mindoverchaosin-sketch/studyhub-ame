import { beforeEach, describe, expect, it, vi } from 'vitest'

const subscriptionRepoMock = vi.hoisted(() => ({
  countByStatus: vi.fn(),
  findMany: vi.fn(),
}))

const planRepoMock = vi.hoisted(() => ({
  findAll: vi.fn(),
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: subscriptionRepoMock,
}))

vi.mock('@/server/domains/billing/plans/plan.repository', () => ({
  planRepository: planRepoMock,
}))

import { BillingAdminService } from '@/server/services/billing-admin.service'

const service = new BillingAdminService()

describe('BillingAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns dashboard metrics from the repositories', async () => {
    subscriptionRepoMock.countByStatus.mockResolvedValueOnce(4)
    subscriptionRepoMock.countByStatus.mockResolvedValueOnce(1)
    subscriptionRepoMock.countByStatus.mockResolvedValueOnce(2)
    subscriptionRepoMock.findMany.mockResolvedValue([
      { id: 'sub-1', status: 'ACTIVE', subscriptionPlan: { slug: 'monthly', interval: 'monthly', productPrice: { amount: 499 } } },
      { id: 'sub-2', status: 'ACTIVE', subscriptionPlan: { slug: 'yearly', interval: 'yearly', productPrice: { amount: 4999 } } },
      { id: 'sub-3', status: 'CANCELLED', subscriptionPlan: { slug: 'monthly', interval: 'monthly', productPrice: { amount: 499 } } },
    ])
    planRepoMock.findAll.mockResolvedValue([])

    const result = await service.getBillingDashboard()

    expect(result.overview.totalSubscriptions).toBe(7)
    expect(result.overview.activeSubscriptions).toBe(4)
    expect(result.overview.monthlyRecurringRevenue).toBe(499 + 4999 / 12)
    expect(result.planDistribution.monthly).toBe(2)
  })
})
