import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  upgradePlan: vi.fn(),
  downgradePlan: vi.fn(),
  renewSubscription: vi.fn(),
  auditRecordEvent: vi.fn(),
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: {
    findById: mocks.findById,
    findMany: vi.fn(),
  },
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.service', () => {
  const SubscriptionService = vi.fn().mockImplementation(() => ({
    upgradePlan: mocks.upgradePlan,
    downgradePlan: mocks.downgradePlan,
    renewSubscription: mocks.renewSubscription,
  }))
  return { SubscriptionService }
})

vi.mock('@/server/services/audit-log.service', () => ({
  auditLogService: { recordEvent: mocks.auditRecordEvent },
}))

import { SubscriptionManagementService } from '@/server/services/subscription-management.service'
import type { SubscriptionDTO } from '@/server/domains/billing/dto/billing.dto'

const ACTOR = { id: 'admin-1', role: 'ADMIN' }

function buildSubscription(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sub_123',
    userId: 'user_123',
    subscriptionPlanId: 'plan_yearly',
    status: 'ACTIVE',
    currentPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
    renewalAttempts: 0,
    cancelledAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-24T00:00:00.000Z'),
    subscriptionPlan: { id: 'plan_yearly', name: 'Yearly', slug: 'yearly', interval: 'yearly' },
    ...overrides,
  }
}

function buildDto(overrides: Partial<SubscriptionDTO> = {}): SubscriptionDTO {
  return {
    id: 'sub_123',
    userId: 'user_123',
    planId: 'plan_yearly',
    planName: 'Yearly',
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
    ...overrides,
  } as SubscriptionDTO
}

describe('subscription management admin delegation', () => {
  let service: SubscriptionManagementService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SubscriptionManagementService()
    mocks.findById.mockResolvedValue(buildSubscription())
    mocks.auditRecordEvent.mockResolvedValue(undefined)
  })

  describe('upgradeSubscription', () => {
    it('resolves the subscription and forwards its userId with the requested plan', async () => {
      mocks.upgradePlan.mockResolvedValue(buildDto({ status: 'ACTIVE' }))

      const result = await service.upgradeSubscription('sub_123', 'plan_monthly', ACTOR)

      expect(mocks.findById).toHaveBeenCalledWith('sub_123')
      // The domain API is user-scoped: the row owner, never the subscription id.
      expect(mocks.upgradePlan).toHaveBeenCalledTimes(1)
      expect(mocks.upgradePlan).toHaveBeenCalledWith('user_123', 'plan_monthly')
      expect(result.status).toBe('ACTIVE')
      expect(mocks.auditRecordEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorId: 'admin-1',
        actorRole: 'ADMIN',
        action: 'subscription.upgraded',
        entityType: 'Subscription',
        entityId: 'sub_123',
        metadata: { planId: 'plan_monthly' },
      }))
    })

    it('throws when the subscription does not exist without touching domain or audit', async () => {
      mocks.findById.mockResolvedValue(null)

      await expect(service.upgradeSubscription('sub_404', 'plan_monthly', ACTOR))
        .rejects.toThrow('Subscription not found: sub_404')

      expect(mocks.upgradePlan).not.toHaveBeenCalled()
      expect(mocks.auditRecordEvent).not.toHaveBeenCalled()
    })

    it('propagates domain errors without recording a success audit event', async () => {
      mocks.upgradePlan.mockRejectedValue(new Error('Plan not found: plan_missing'))

      await expect(service.upgradeSubscription('sub_123', 'plan_missing', ACTOR))
        .rejects.toThrow('Plan not found: plan_missing')

      expect(mocks.auditRecordEvent).not.toHaveBeenCalled()
    })
  })

  describe('downgradeSubscription', () => {
    it('resolves the subscription and forwards its userId with the scheduled plan', async () => {
      mocks.downgradePlan.mockResolvedValue(buildDto({
        scheduledPlanId: 'plan_monthly',
        scheduledPlanEffectiveAt: new Date('2026-09-01T00:00:00.000Z'),
      }))

      const result = await service.downgradeSubscription('sub_123', 'plan_monthly', ACTOR)

      expect(mocks.findById).toHaveBeenCalledWith('sub_123')
      expect(mocks.downgradePlan).toHaveBeenCalledTimes(1)
      expect(mocks.downgradePlan).toHaveBeenCalledWith('user_123', 'plan_monthly')
      expect(result.scheduledPlanId).toBe('plan_monthly')
      expect(mocks.auditRecordEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorId: 'admin-1',
        action: 'subscription.downgraded',
        entityId: 'sub_123',
        metadata: { planId: 'plan_monthly' },
      }))
    })

    it('throws when the subscription does not exist without touching domain or audit', async () => {
      mocks.findById.mockResolvedValue(null)

      await expect(service.downgradeSubscription('sub_404', 'plan_monthly', ACTOR))
        .rejects.toThrow('Subscription not found: sub_404')

      expect(mocks.downgradePlan).not.toHaveBeenCalled()
      expect(mocks.auditRecordEvent).not.toHaveBeenCalled()
    })

    it('propagates domain errors without recording a success audit event', async () => {
      mocks.downgradePlan.mockRejectedValue(new Error('Plan not found: plan_missing'))

      await expect(service.downgradeSubscription('sub_123', 'plan_missing', ACTOR))
        .rejects.toThrow('Plan not found: plan_missing')

      expect(mocks.auditRecordEvent).not.toHaveBeenCalled()
    })
  })

  describe('renewSubscription', () => {
    it('resolves the subscription and forwards its userId to the domain renewal', async () => {
      mocks.renewSubscription.mockResolvedValue(buildDto())

      const result = await service.renewSubscription('sub_123', ACTOR)

      expect(mocks.findById).toHaveBeenCalledWith('sub_123')
      expect(mocks.renewSubscription).toHaveBeenCalledTimes(1)
      expect(mocks.renewSubscription).toHaveBeenCalledWith('user_123')
      expect(result.status).toBe('ACTIVE')
      expect(mocks.auditRecordEvent).toHaveBeenCalledWith(expect.objectContaining({
        actorId: 'admin-1',
        action: 'subscription.renewed',
        entityType: 'Subscription',
        entityId: 'sub_123',
      }))
    })

    it('throws when the subscription does not exist without touching domain or audit', async () => {
      mocks.findById.mockResolvedValue(null)

      await expect(service.renewSubscription('sub_404', ACTOR))
        .rejects.toThrow('Subscription not found: sub_404')

      expect(mocks.renewSubscription).not.toHaveBeenCalled()
      expect(mocks.auditRecordEvent).not.toHaveBeenCalled()
    })

    it('propagates domain errors without recording a success audit event', async () => {
      mocks.renewSubscription.mockRejectedValue(new Error('No subscription for user: user_123'))

      await expect(service.renewSubscription('sub_123', ACTOR))
        .rejects.toThrow('No subscription for user: user_123')

      expect(mocks.auditRecordEvent).not.toHaveBeenCalled()
    })
  })
})
