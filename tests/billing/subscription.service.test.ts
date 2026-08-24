import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SubscriptionService } from '@/server/domains/billing/subscriptions/subscription.service'
import * as subscriptionRepo from '@/server/domains/billing/subscriptions/subscription.repository'
import * as planRepo from '@/server/domains/billing/plans/plan.repository'

const mocks = vi.hoisted(() => ({
  findByUserId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  expire: vi.fn(),
  cancel: vi.fn(),
  countActiveSubscriptions: vi.fn(),
  countByStatus: vi.fn(),
  findExpiredSubscriptions: vi.fn(),
  planFindById: vi.fn(),
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: {
    findByUserId: mocks.findByUserId,
    findById: mocks.findById,
    create: mocks.create,
    update: mocks.update,
    expire: mocks.expire,
    cancel: mocks.cancel,
    countActiveSubscriptions: mocks.countActiveSubscriptions,
    countByStatus: mocks.countByStatus,
    findExpiredSubscriptions: mocks.findExpiredSubscriptions,
  },
}))

vi.mock('@/server/domains/billing/plans/plan.repository', () => ({
  planRepository: {
    findById: mocks.planFindById,
  },
}))

describe('SubscriptionService', () => {
  let service: SubscriptionService

  beforeEach(() => {
    service = new SubscriptionService()
    vi.clearAllMocks()
  })

  describe('createSubscription', () => {
    it('should create a new monthly subscription', async () => {
      const planId = 'plan_123'
      const userId = 'user_123'
      const startDate = new Date('2026-01-01')

      mocks.planFindById.mockResolvedValue({
        id: planId,
        slug: 'monthly',
        name: 'Monthly',
        interval: 'monthly',
      })

      const mockSub = {
        id: 'sub_123',
        userId,
        subscriptionPlanId: planId,
        status: 'ACTIVE',
        currentPeriodStart: startDate,
        currentPeriodEnd: new Date('2026-02-01'),
        renewalAttempts: 0,
        subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mocks.create.mockResolvedValue(mockSub)

      const result = await service.createSubscription(userId, planId, startDate)

      expect(result).toMatchObject({
        id: 'sub_123',
        userId,
        status: 'ACTIVE',
      })
      expect(mocks.create).toHaveBeenCalled()
    })

    it('should throw error if plan not found', async () => {
      mocks.planFindById.mockResolvedValue(null)

      await expect(service.createSubscription('user_123', 'invalid_plan')).rejects.toThrow('Plan not found')
    })
  })

  describe('upgradePlan', () => {
    it('should upgrade to a higher plan', async () => {
      const userId = 'user_123'
      const newPlanId = 'plan_yearly'

      const currentSub = {
        id: 'sub_123',
        userId,
        subscriptionPlanId: 'plan_monthly',
        status: 'ACTIVE',
        subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        renewalAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const upgradedSub = {
        ...currentSub,
        subscriptionPlanId: newPlanId,
        subscriptionPlan: { name: 'Yearly', slug: 'yearly', interval: 'yearly' },
      }

      mocks.findByUserId.mockResolvedValue(currentSub)
      mocks.planFindById.mockResolvedValue({
        id: newPlanId,
        name: 'Yearly',
        interval: 'yearly',
      })
      mocks.update.mockResolvedValue(upgradedSub)

      const result = await service.upgradePlan(userId, newPlanId)

      expect(result.planId).toBe(newPlanId)
      expect(mocks.update).toHaveBeenCalled()
    })

    it('should throw error if no current subscription', async () => {
      mocks.findByUserId.mockResolvedValue(null)

      await expect(service.upgradePlan('user_123', 'plan_yearly')).rejects.toThrow('No active subscription')
    })
  })

  describe('downgradePlan', () => {
    it('schedules a downgrade for the current period end', async () => {
      const currentEnd = new Date('2026-09-01')
      mocks.findByUserId.mockResolvedValue({
        id: 'sub_123',
        subscriptionPlan: { name: 'Yearly', slug: 'yearly', interval: 'yearly' },
        currentPeriodEnd: currentEnd,
      })
      mocks.planFindById.mockResolvedValue({ id: 'plan_monthly', interval: 'monthly' })
      mocks.update.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        subscriptionPlanId: 'plan_yearly',
        status: 'ACTIVE',
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: currentEnd,
        renewalAttempts: 0,
        subscriptionPlan: { name: 'Yearly', slug: 'yearly', interval: 'yearly' },
        scheduledPlanId: 'plan_monthly',
        scheduledPlanEffectiveAt: currentEnd,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await service.downgradePlan('user_123', 'plan_monthly')

      expect(mocks.update).toHaveBeenCalledWith('sub_123', expect.objectContaining({
        scheduledPlanId: 'plan_monthly',
        scheduledPlanEffectiveAt: currentEnd,
      }))
    })
  })

  describe('renewSubscription', () => {
    it('applies the scheduled downgrade at renewal', async () => {
      const renewalStart = new Date('2026-09-01')
      const scheduledSub = {
        id: 'sub_123',
        userId: 'user_123',
        subscriptionPlanId: 'plan_yearly',
        scheduledPlanId: 'plan_monthly',
        subscriptionPlan: { name: 'Yearly', slug: 'yearly', interval: 'yearly' },
        currentPeriodStart: new Date('2025-09-01'),
        currentPeriodEnd: renewalStart,
        status: 'ACTIVE',
        renewalAttempts: 0,
      }
      mocks.findByUserId.mockResolvedValue(scheduledSub)
      mocks.planFindById.mockResolvedValue({ id: 'plan_monthly', interval: 'monthly' })
      mocks.update.mockResolvedValue({
        ...scheduledSub,
        subscriptionPlanId: 'plan_monthly',
        subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
      })

      await service.renewSubscription('user_123', renewalStart)

      expect(mocks.update).toHaveBeenCalledWith('sub_123', expect.objectContaining({
        subscriptionPlan: { connect: { id: 'plan_monthly' } },
        scheduledPlanId: null,
        scheduledPlanEffectiveAt: null,
      }))
    })
  })

  describe('markPaymentFailed', () => {
    it('marks a monthly subscription past due for three days', async () => {
      const attemptedAt = new Date('2026-08-22T00:00:00.000Z')
      mocks.findById.mockResolvedValue({
        id: 'sub_123',
        pastDueAt: null,
        subscriptionPlan: { interval: 'monthly' },
      })
      mocks.update.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        status: 'PAST_DUE',
        subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
        currentPeriodStart: attemptedAt,
        currentPeriodEnd: new Date('2026-09-22'),
        renewalAttempts: 0,
        retryAttemptCount: 1,
        pastDueAt: attemptedAt,
        gracePeriodEndsAt: new Date('2026-08-25T00:00:00.000Z'),
        createdAt: attemptedAt,
        updatedAt: attemptedAt,
      })

      await service.markPaymentFailed('sub_123', attemptedAt)

      expect(mocks.update).toHaveBeenCalledWith('sub_123', expect.objectContaining({
        status: 'PAST_DUE',
        gracePeriodEndsAt: new Date('2026-08-25T00:00:00.000Z'),
        retryAttemptCount: { increment: 1 },
      }))
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel an active subscription', async () => {
      const subId = 'sub_123'

      const cancelledSub = {
        id: subId,
        userId: 'user_123',
        status: 'CANCELLED',
        cancelledAt: new Date(),
        subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        renewalAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mocks.findById.mockResolvedValue({ ...cancelledSub, providerSubscriptionId: null })
      mocks.cancel.mockResolvedValue(cancelledSub)

      const result = await service.cancelSubscription(subId)

      expect(result.status).toBe('CANCELLED')
      expect(result.cancelledAt).toBeDefined()
    })
  })

  describe('expireSubscription', () => {
    it('should expire a subscription', async () => {
      const subId = 'sub_123'

      const expiredSub = {
        id: subId,
        userId: 'user_123',
        status: 'EXPIRED',
        subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        renewalAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mocks.findById.mockResolvedValue({ ...expiredSub, cancelAtPeriodEnd: false })
      mocks.expire.mockResolvedValue(expiredSub)

      const result = await service.expireSubscription(subId)

      expect(result.status).toBe('EXPIRED')
    })
  })

  describe('getSubscriptionStats', () => {
    it('should return subscription statistics', async () => {
      mocks.countActiveSubscriptions.mockResolvedValue(100)
      mocks.countByStatus.mockResolvedValueOnce(30) // expired
      mocks.countByStatus.mockResolvedValueOnce(10) // cancelled
      mocks.countByStatus.mockResolvedValueOnce(5)  // paused

      const stats = await service.getSubscriptionStats()

      expect(stats).toMatchObject({
        active: 100,
        expired: 30,
        cancelled: 10,
        paused: 5,
        total: 145,
      })
    })
  })

  describe('pauseSubscription', () => {
    const baseRow = {
      id: 'sub_123',
      userId: 'user_123',
      subscriptionPlanId: 'plan_monthly',
      currentPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-09-01T00:00:00.000Z'),
      renewalAttempts: 0,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date(),
      subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
    }

    it('pauses an active subscription', async () => {
      mocks.findById.mockResolvedValue({ ...baseRow, status: 'ACTIVE' })
      const paused = { ...baseRow, status: 'PAUSED' }
      mocks.update.mockResolvedValue(paused)

      const result = await service.pauseSubscription('sub_123')

      // Exact payload: only the status changes.
      expect(mocks.update).toHaveBeenCalledWith('sub_123', { status: 'PAUSED' })
      expect(result.status).toBe('PAUSED')
    })

    it('pauses a past-due subscription (admin dunning hold)', async () => {
      mocks.findById.mockResolvedValue({
        ...baseRow,
        status: 'PAST_DUE',
        pastDueAt: new Date('2026-08-20T00:00:00.000Z'),
        gracePeriodEndsAt: new Date('2026-08-23T00:00:00.000Z'),
      })
      mocks.update.mockResolvedValue({ ...baseRow, status: 'PAUSED' })

      const result = await service.pauseSubscription('sub_123')

      expect(mocks.update).toHaveBeenCalledWith('sub_123', { status: 'PAUSED' })
      expect(result.status).toBe('PAUSED')
    })

    it.each(['PAUSED', 'CANCELLED', 'EXPIRED'])(
      'rejects pausing a subscription in status %s',
      async (status) => {
        mocks.findById.mockResolvedValue({ ...baseRow, status })

        await expect(service.pauseSubscription('sub_123'))
          .rejects.toThrow(`Cannot pause subscription in status: ${status}`)

        expect(mocks.update).not.toHaveBeenCalled()
      },
    )

    it('throws the not-found error for a missing subscription without updating', async () => {
      mocks.findById.mockResolvedValue(null)

      await expect(service.pauseSubscription('sub_404'))
        .rejects.toThrow('Subscription not found: sub_404')

      expect(mocks.update).not.toHaveBeenCalled()
    })
  })

  describe('resumeSubscription', () => {
    const periodEnd = new Date('2026-09-01T00:00:00.000Z')
    const pausedRow = {
      id: 'sub_123',
      userId: 'user_123',
      subscriptionPlanId: 'plan_monthly',
      status: 'PAUSED',
      currentPeriodStart: new Date('2026-08-01T00:00:00.000Z'),
      currentPeriodEnd: periodEnd,
      renewalAttempts: 0,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date(),
      subscriptionPlan: { name: 'Monthly', slug: 'monthly', interval: 'monthly' },
    }

    it('resumes a paused subscription preserving the existing period end exactly', async () => {
      mocks.findById.mockResolvedValue({ ...pausedRow })
      mocks.update.mockResolvedValue({ ...pausedRow, status: 'ACTIVE' })

      const result = await service.resumeSubscription('sub_123')

      // Exact payload: resume is strictly restorative — no fresh period may
      // be minted and no other field may change.
      expect(mocks.update).toHaveBeenCalledTimes(1)
      expect(mocks.update).toHaveBeenCalledWith('sub_123', { status: 'ACTIVE' })
      expect(result.status).toBe('ACTIVE')
      expect(result.currentPeriodEnd).toEqual(periodEnd)
    })

    it('does not extend the period of a lapsed paused subscription', async () => {
      const lapsed = {
        ...pausedRow,
        currentPeriodEnd: new Date('2026-01-01T00:00:00.000Z'),
      }
      mocks.findById.mockResolvedValue({ ...lapsed })
      mocks.update.mockResolvedValue({ ...lapsed, status: 'ACTIVE' })

      await service.resumeSubscription('sub_123')

      // Even with a long-elapsed period, the update must carry no
      // currentPeriodEnd override — expiration finalizes it instead.
      expect(mocks.update).toHaveBeenCalledWith('sub_123', { status: 'ACTIVE' })
      expect(mocks.update.mock.calls[0][1]).not.toHaveProperty('currentPeriodEnd')
    })

    it.each(['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'])(
      'rejects resuming a subscription in status %s',
      async (status) => {
        mocks.findById.mockResolvedValue({ ...pausedRow, status })

        await expect(service.resumeSubscription('sub_123'))
          .rejects.toThrow(`Cannot resume subscription in status: ${status}. Only paused subscriptions can be resumed.`)

        expect(mocks.update).not.toHaveBeenCalled()
      },
    )

    it('throws the not-found error for a missing subscription without updating', async () => {
      mocks.findById.mockResolvedValue(null)

      await expect(service.resumeSubscription('sub_404'))
        .rejects.toThrow('Subscription not found: sub_404')

      expect(mocks.update).not.toHaveBeenCalled()
    })
  })
})
