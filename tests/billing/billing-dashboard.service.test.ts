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

import { BillingDashboardService } from '@/server/services/billing-dashboard.service'

const service = new BillingDashboardService()

describe('BillingDashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates dashboard metrics from repository data', async () => {
    subscriptionRepoMock.countByStatus.mockResolvedValueOnce(5)
    subscriptionRepoMock.countByStatus.mockResolvedValueOnce(1)
    subscriptionRepoMock.countByStatus.mockResolvedValueOnce(2)
    subscriptionRepoMock.findMany.mockResolvedValue([
      { id: 'sub-1', status: 'ACTIVE', subscriptionPlan: { slug: 'monthly', interval: 'monthly', price: 499 } },
      { id: 'sub-2', status: 'ACTIVE', subscriptionPlan: { slug: 'yearly', interval: 'yearly', price: 4999 } },
      { id: 'sub-3', status: 'ACTIVE', subscriptionPlan: { slug: 'lifetime', interval: 'lifetime', price: 9999 } },
      { id: 'sub-4', status: 'CANCELLED', subscriptionPlan: { slug: 'monthly', interval: 'monthly', price: 499 } },
    ])
    planRepoMock.findAll.mockResolvedValue([])

    const result = await service.getBillingDashboard()

    expect(result.overview.totalSubscriptions).toBe(8)
    expect(result.overview.activeSubscriptions).toBe(5)
    expect(result.overview.cancelledSubscriptions).toBe(1)
    expect(result.overview.expiredSubscriptions).toBe(2)
    expect(result.overview.monthlyRecurringRevenue).toBe(499 + 4999 / 12 + 0)
    expect(result.overview.annualRecurringRevenue).toBe(result.overview.monthlyRecurringRevenue * 12)
    expect(result.overview.lifetimeSubscriptions).toBe(1)
    expect(result.planDistribution.monthly).toBe(2)
    expect(result.planDistribution.yearly).toBe(1)
    expect(result.planDistribution.lifetime).toBe(1)
  })

  it('returns zeroed metrics when there is no billing data', async () => {
    subscriptionRepoMock.countByStatus.mockResolvedValue(0)
    subscriptionRepoMock.findMany.mockResolvedValue([])
    planRepoMock.findAll.mockResolvedValue([])

    const result = await service.getBillingDashboard()

    expect(result.overview.totalSubscriptions).toBe(0)
    expect(result.overview.monthlyRecurringRevenue).toBe(0)
    expect(result.overview.annualRecurringRevenue).toBe(0)
    expect(result.overview.lifetimeSubscriptions).toBe(0)
    expect(result.planDistribution).toEqual({})
  })
})
