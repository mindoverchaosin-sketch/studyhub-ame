import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EntitlementService } from '@/server/domains/billing/entitlements/entitlement.service'
import * as subscriptionRepo from '@/server/domains/billing/subscriptions/subscription.repository'

const mocks = vi.hoisted(() => ({
  findByUserId: vi.fn(),
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: {
    findByUserId: mocks.findByUserId,
  },
}))

vi.mock('@/server/domains/billing/plans/plan.config', () => ({
  getPlanBySlug: (slug: string) => {
    const plans: any = {
      free: { name: 'Free', slug: 'free', features: [] },
      monthly: {
        name: 'Monthly',
        slug: 'monthly',
        features: ['premiumModules', 'unlimitedMockExams', 'downloadResources'],
      },
      yearly: {
        name: 'Yearly',
        slug: 'yearly',
        features: [
          'premiumModules',
          'unlimitedMockExams',
          'downloadResources',
          'analytics',
          'aiTools',
        ],
      },
    }
    return plans[slug]
  },
}))

describe('EntitlementService', () => {
  let service: EntitlementService

  beforeEach(() => {
    service = new EntitlementService()
    vi.clearAllMocks()
  })

  describe('hasFeatureAccess', () => {
    it('should grant access to feature if subscription is active', async () => {
      const userId = 'user_123'
      const now = new Date()
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

      mocks.findByUserId.mockResolvedValue({
        id: 'sub_123',
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.hasFeatureAccess(userId, 'premiumModules')

      expect(result).toMatchObject({
        userId,
        feature: 'premiumModules',
        hasAccess: true,
        expiresAt: futureDate,
      })
    })

    it('should deny access if subscription is expired', async () => {
      const userId = 'user_123'
      const pastDate = new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago

      mocks.findByUserId.mockResolvedValue({
        id: 'sub_123',
        userId,
        status: 'ACTIVE',
        currentPeriodEnd: pastDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.hasFeatureAccess(userId, 'premiumModules')

      expect(result.hasAccess).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('should deny access if subscription is cancelled', async () => {
      const userId = 'user_123'
      const futureDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        id: 'sub_123',
        userId,
        status: 'CANCELLED',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.hasFeatureAccess(userId, 'premiumModules')

      expect(result.hasAccess).toBe(false)
      expect(result.reason).toContain('cancelled')
    })

    it('should deny access if no subscription exists', async () => {
      mocks.findByUserId.mockResolvedValue(null)

      const result = await service.hasFeatureAccess('user_123', 'premiumModules')

      expect(result).toMatchObject({
        hasAccess: false,
        reason: 'No active subscription',
      })
    })
  })

  describe('canAccessPremiumModules', () => {
    it('should return true for active premium subscription', async () => {
      const futureDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.canAccessPremiumModules('user_123')

      expect(result).toBe(true)
    })

    it('should return false for expired subscription', async () => {
      const pastDate = new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: pastDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.canAccessPremiumModules('user_123')

      expect(result).toBe(false)
    })
  })

  describe('canAttemptUnlimitedMockExams', () => {
    it('should return true for monthly or higher subscription', async () => {
      const futureDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.canAttemptUnlimitedMockExams('user_123')

      expect(result).toBe(true)
    })
  })

  describe('canAccessAnalytics', () => {
    it('should return true for yearly subscription', async () => {
      const futureDate = new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'yearly', name: 'Yearly' },
      })

      const result = await service.canAccessAnalytics('user_123')

      expect(result).toBe(true)
    })

    it('should return false for monthly subscription', async () => {
      const futureDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.canAccessAnalytics('user_123')

      expect(result).toBe(false)
    })
  })

  describe('getUserEntitlements', () => {
    it('should return list of features for active subscription', async () => {
      const futureDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.getUserEntitlements('user_123')

      expect(result.features).toContain('premiumModules')
      expect(result.subscriptionStatus).toBe('ACTIVE')
      expect(result.planName).toBe('Monthly')
    })

    it('should return empty features for no subscription', async () => {
      mocks.findByUserId.mockResolvedValue(null)

      const result = await service.getUserEntitlements('user_123')

      expect(result.features).toEqual([])
      expect(result.subscriptionStatus).toBe(null)
    })
  })

  describe('hasActiveSubscription', () => {
    it('should return true for active subscription with valid period', async () => {
      const futureDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.hasActiveSubscription('user_123')

      expect(result).toBe(true)
    })

    it('should return false if no subscription', async () => {
      mocks.findByUserId.mockResolvedValue(null)

      const result = await service.hasActiveSubscription('user_123')

      expect(result).toBe(false)
    })

    it('should return false if period is expired', async () => {
      const pastDate = new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000)

      mocks.findByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: pastDate,
        subscriptionPlan: { slug: 'monthly', name: 'Monthly' },
      })

      const result = await service.hasActiveSubscription('user_123')

      expect(result).toBe(false)
    })
  })
})
