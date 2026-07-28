import { beforeEach, describe, expect, it, vi } from 'vitest'

const subscriptionRepoMock = vi.hoisted(() => ({
  findByUserId: vi.fn(),
}))

const invoiceRepoMock = vi.hoisted(() => ({
  findBySubscriptionId: vi.fn(),
}))

const planManagementServiceMock = vi.hoisted(() => ({
  getPlans: vi.fn(),
}))

const entitlementServiceMock = vi.hoisted(() => ({
  getUserEntitlements: vi.fn(),
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: subscriptionRepoMock,
}))

vi.mock('@/server/domains/billing/invoices/invoice.repository', () => ({
  invoiceRepository: invoiceRepoMock,
}))

vi.mock('@/server/services/plan-management.service', () => ({
  planManagementService: planManagementServiceMock,
}))

vi.mock('@/server/domains/billing/entitlements/entitlement.service', () => ({
  entitlementService: entitlementServiceMock,
}))

import { BillingFacadeService } from '@/server/services/billing-facade.service'

const service = new BillingFacadeService()

describe('BillingFacadeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns student billing overview with subscription, invoices, available plans, and entitlements', async () => {
    subscriptionRepoMock.findByUserId.mockResolvedValue({
      id: 'sub-1',
      subscriptionPlanId: 'plan_monthly',
      subscriptionPlan: { id: 'plan_monthly', slug: 'monthly', name: 'Monthly', price: 499, productPrice: { currency: 'INR' }, interval: 'monthly' },
      status: 'ACTIVE',
      currentPeriodStart: new Date('2025-01-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2025-02-01T00:00:00.000Z'),
    })

    invoiceRepoMock.findBySubscriptionId.mockResolvedValue([
      { id: 'inv-1', invoiceNumber: 'INV-001', subscriptionId: 'sub-1', status: 'PAID', amount: 499, currency: 'INR', dueDate: new Date('2025-01-01'), paidAt: new Date('2025-01-01'), description: 'Monthly subscription', createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
    ])

    entitlementServiceMock.getUserEntitlements.mockResolvedValue({
      features: ['premiumModules'],
      subscriptionStatus: 'ACTIVE',
      planName: 'Monthly',
      expiresAt: new Date('2025-02-01T00:00:00.000Z'),
    })

    planManagementServiceMock.getPlans.mockResolvedValue({ plans: [{ id: 'plan_monthly', slug: 'monthly', name: 'Monthly', interval: 'monthly', price: 499, currency: 'INR', isActive: true, features: ['premiumModules'], description: 'Monthly plan', displayOrder: 2, createdAt: new Date(), updatedAt: new Date() }], total: 1 })

    const result = await service.getStudentBillingOverview('user-1')

    expect(result.currentSubscription).toMatchObject({
      planName: 'Monthly',
      status: 'ACTIVE',
      renewalAmount: 499,
    })
    expect(result.invoices).toHaveLength(1)
    expect(result.availablePlans).toHaveLength(1)
    expect(result.entitlements.features).toEqual(['premiumModules'])
  })

  it('returns an empty overview when the student has no subscription', async () => {
    subscriptionRepoMock.findByUserId.mockResolvedValue(null)
    invoiceRepoMock.findBySubscriptionId.mockResolvedValue([])
    entitlementServiceMock.getUserEntitlements.mockResolvedValue({ features: [], subscriptionStatus: null })
    planManagementServiceMock.getPlans.mockResolvedValue({ plans: [], total: 0 })

    const result = await service.getStudentBillingOverview('user-2')

    expect(result.currentSubscription).toBeNull()
    expect(result.invoices).toEqual([])
    expect(result.availablePlans).toEqual([])
    expect(result.entitlements.features).toEqual([])
  })
})
