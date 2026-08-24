import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  cancel: vi.fn(),
  providerCancelSubscription: vi.fn(),
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: {
    findById: mocks.findById,
    cancel: mocks.cancel,
  },
}))

vi.mock('@/server/domains/billing/invoices/invoice.repository', () => ({
  invoiceRepository: {},
}))

vi.mock('@/server/domains/billing/plans/plan.repository', () => ({
  planRepository: {},
}))

vi.mock('@/server/domains/billing/payments/payment.service', () => ({
  paymentService: {
    cancelSubscription: mocks.providerCancelSubscription,
  },
}))

import { SubscriptionService } from '@/server/domains/billing/subscriptions/subscription.service'

function buildSubscription(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sub-1',
    userId: 'user-1',
    subscriptionPlanId: 'plan-1',
    providerSubscriptionId: 'rzp-sub-77',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
    renewalAttempts: 0,
    cancelledAt: null,
    cancelAtPeriodEnd: false,
    scheduledPlanId: null,
    scheduledPlanEffectiveAt: null,
    pastDueAt: null,
    gracePeriodEndsAt: null,
    lastPaymentAttemptAt: null,
    retryAttemptCount: 0,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-24T00:00:00.000Z'),
    subscriptionPlan: { id: 'plan-1', name: 'Monthly', interval: 'monthly' },
    ...overrides,
  }
}

function providerStatus(status: 'CANCELLED' | 'FAILED') {
  return {
    paymentId: 'subscription_rzp-sub-77',
    status,
    amount: 0,
    currency: 'INR',
    captured: false,
    updatedAt: new Date(),
    metadata: {},
  }
}

describe('student cancellation gateway integration', () => {
  let service: SubscriptionService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SubscriptionService()
    mocks.cancel.mockImplementation(async (id: string) =>
      buildSubscription({ id, status: 'CANCELLED', cancelledAt: new Date() }),
    )
  })

  describe('provider subscription bound', () => {
    it('invokes the provider exactly once with the stored id before cancelling locally', async () => {
      mocks.findById.mockResolvedValue(buildSubscription())
      mocks.providerCancelSubscription.mockResolvedValue(providerStatus('CANCELLED'))

      await service.cancelSubscription('sub-1')

      expect(mocks.providerCancelSubscription).toHaveBeenCalledTimes(1)
      expect(mocks.providerCancelSubscription).toHaveBeenCalledWith('rzp-sub-77')
      // Local cancellation must be gated on provider success: provider first,
      // repository second.
      expect(mocks.providerCancelSubscription.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.cancel.mock.invocationCallOrder[0],
      )
    })

    it('reaches local cancellation exactly once after provider success', async () => {
      mocks.findById.mockResolvedValue(buildSubscription())
      mocks.providerCancelSubscription.mockResolvedValue(providerStatus('CANCELLED'))

      const result = await service.cancelSubscription('sub-1')

      expect(result.status).toBe('CANCELLED')
      expect(result.cancelledAt).toBeDefined()
      expect(mocks.cancel).toHaveBeenCalledTimes(1)
      expect(mocks.cancel).toHaveBeenCalledWith('sub-1')
    })

    it('fails closed and skips local cancellation when the provider reports failure', async () => {
      mocks.findById.mockResolvedValue(buildSubscription())
      mocks.providerCancelSubscription.mockResolvedValue(providerStatus('FAILED'))

      await expect(service.cancelSubscription('sub-1')).rejects.toThrow('Provider subscription cancellation failed.')

      expect(mocks.cancel).not.toHaveBeenCalled()
    })
  })

  describe('no provider binding', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('skips the gateway entirely when providerSubscriptionId is %s', async (_label, providerId) => {
      mocks.findById.mockResolvedValue(buildSubscription({ providerSubscriptionId: providerId }))

      const result = await service.cancelSubscription('sub-1')

      expect(mocks.providerCancelSubscription).not.toHaveBeenCalled()
      expect(mocks.cancel).toHaveBeenCalledTimes(1)
      expect(mocks.cancel).toHaveBeenCalledWith('sub-1')
      expect(result.status).toBe('CANCELLED')
    })
  })

  describe('unknown subscription', () => {
    it('throws before any provider or local cancellation occurs', async () => {
      mocks.findById.mockResolvedValue(null)

      await expect(service.cancelSubscription('missing-sub')).rejects.toThrow('Subscription not found: missing-sub')

      expect(mocks.providerCancelSubscription).not.toHaveBeenCalled()
      expect(mocks.cancel).not.toHaveBeenCalled()
    })
  })
})
