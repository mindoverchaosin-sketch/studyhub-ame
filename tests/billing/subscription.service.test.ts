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
})
