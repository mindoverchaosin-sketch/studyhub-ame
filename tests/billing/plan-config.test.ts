import { describe, it, expect, beforeEach } from 'vitest'
import { getPlanBySlug, getPlanById, getActivePlans, planHasFeature, getFeatureDisplayName } from '@/server/domains/billing/plans/plan.config'

describe('Plan Configuration', () => {
  describe('getPlanBySlug', () => {
    it('should return FREE plan', () => {
      const plan = getPlanBySlug('free')
      expect(plan).toMatchObject({
        slug: 'free',
        name: 'Free',
        price: 0,
        features: [],
      })
    })

    it('should return MONTHLY plan', () => {
      const plan = getPlanBySlug('monthly')
      expect(plan).toMatchObject({
        slug: 'monthly',
        name: 'Monthly',
        interval: 'monthly',
      })
      expect(plan?.features).toContain('premiumModules')
      expect(plan?.features).toContain('unlimitedMockExams')
    })

    it('should return YEARLY plan', () => {
      const plan = getPlanBySlug('yearly')
      expect(plan).toMatchObject({
        slug: 'yearly',
        name: 'Yearly',
        interval: 'yearly',
      })
      expect(plan?.features).toContain('aiTools')
    })

    it('should return LIFETIME plan', () => {
      const plan = getPlanBySlug('lifetime')
      expect(plan).toMatchObject({
        slug: 'lifetime',
        name: 'Lifetime',
        interval: 'lifetime',
      })
    })

    it('should return undefined for unknown plan', () => {
      const plan = getPlanBySlug('unknown')
      expect(plan).toBeUndefined()
    })
  })

  describe('getPlanById', () => {
    it('should return plan by ID', () => {
      const plan = getPlanById('plan_free')
      expect(plan?.slug).toBe('free')
    })

    it('should return undefined for unknown ID', () => {
      const plan = getPlanById('unknown_id')
      expect(plan).toBeUndefined()
    })
  })

  describe('getActivePlans', () => {
    it('should return all active plans sorted by displayOrder', () => {
      const plans = getActivePlans()
      expect(plans.length).toBeGreaterThan(0)
      expect(plans[0].displayOrder).toBeLessThanOrEqual(plans[plans.length - 1].displayOrder)
    })

    it('should include all expected plans', () => {
      const plans = getActivePlans()
      const slugs = plans.map((p) => p.slug)
      expect(slugs).toContain('free')
      expect(slugs).toContain('monthly')
      expect(slugs).toContain('yearly')
    })

    it('should include only active plans', () => {
      const plans = getActivePlans()
      plans.forEach((plan) => {
        expect(plan.isActive).toBe(true)
      })
    })
  })

  describe('planHasFeature', () => {
    it('should return true if plan has feature', () => {
      const has = planHasFeature('monthly', 'premiumModules')
      expect(has).toBe(true)
    })

    it('should return false if plan does not have feature', () => {
      const has = planHasFeature('free', 'premiumModules')
      expect(has).toBe(false)
    })

    it('should return false for non-existent plan', () => {
      const has = planHasFeature('unknown', 'premiumModules')
      expect(has).toBe(false)
    })

    it('should return true for aiTools in yearly plan only', () => {
      expect(planHasFeature('yearly', 'aiTools')).toBe(true)
      expect(planHasFeature('monthly', 'aiTools')).toBe(false)
      expect(planHasFeature('free', 'aiTools')).toBe(false)
    })

    it('should return true for analytics in quarterly and yearly', () => {
      expect(planHasFeature('quarterly', 'analytics')).toBe(true)
      expect(planHasFeature('yearly', 'analytics')).toBe(true)
      expect(planHasFeature('monthly', 'analytics')).toBe(false)
    })
  })

  describe('getFeatureDisplayName', () => {
    it('should return display name for feature', () => {
      expect(getFeatureDisplayName('premiumModules')).toBe('Premium Modules')
      expect(getFeatureDisplayName('unlimitedMockExams')).toBe('Unlimited Mock Exams')
      expect(getFeatureDisplayName('aiTools')).toBe('AI Tools')
    })

    it('should return feature name if display name not found', () => {
      const name = getFeatureDisplayName('unknownFeature' as any)
      expect(name).toBeDefined()
    })
  })

  describe('Plan pricing', () => {
    it('should have increasing prices for higher tiers', () => {
      const free = getPlanBySlug('free')
      const monthly = getPlanBySlug('monthly')
      const quarterly = getPlanBySlug('quarterly')
      const yearly = getPlanBySlug('yearly')

      expect(free?.price).toBe(0)
      expect((monthly?.price || 0) > 0).toBe(true)
      expect((quarterly?.price || 0) > (monthly?.price || 0)).toBe(true)
      expect((yearly?.price || 0) > (quarterly?.price || 0)).toBe(true)
    })
  })

  describe('Plan intervals', () => {
    it('should have correct intervals', () => {
      expect(getPlanBySlug('monthly')?.interval).toBe('monthly')
      expect(getPlanBySlug('quarterly')?.interval).toBe('quarterly')
      expect(getPlanBySlug('yearly')?.interval).toBe('yearly')
      expect(getPlanBySlug('lifetime')?.interval).toBe('lifetime')
    })
  })
})
