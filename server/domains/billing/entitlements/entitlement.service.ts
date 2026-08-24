/**
 * EntitlementService
 * 
 * Determines what features and resources a user can access based on their subscription.
 * This is the core service for checking feature access.
 * 
 * Usage:
 *   const canAccess = await entitlementService.canAccessPremiumModules(userId)
 *   const entitlements = await entitlementService.getUserEntitlements(userId)
 */

import { subscriptionRepository } from '@/server/domains/billing/subscriptions/subscription.repository'
import { planHasFeature, getPlanBySlug } from '@/server/domains/billing/plans/plan.config'
import type { EntitlementCheckDTO, EntitlementListDTO, FeatureName } from '@/server/domains/billing/dto/billing.dto'
import type { SubscriptionStatus } from '@/server/domains/billing/dto/billing.dto'

export class EntitlementService {
  /**
   * Get a user's active subscription with plan details
   */
  async getUserSubscription(userId: string) {
    return subscriptionRepository.findByUserId(userId)
  }

  /**
   * Check if a user has access to a specific feature
   */
  async hasFeatureAccess(userId: string, feature: FeatureName): Promise<EntitlementCheckDTO> {
    const subscription = await this.getUserSubscription(userId)

    // If no subscription, user has access to free features only
    if (!subscription) {
      return {
        userId,
        feature,
        hasAccess: false,
        reason: 'No active subscription',
      }
    }

    // Check subscription status
    const inGracePeriod = subscription.status === 'PAST_DUE' &&
      Boolean(subscription.gracePeriodEndsAt && new Date() <= subscription.gracePeriodEndsAt)

    if (subscription.status !== 'ACTIVE' && !inGracePeriod) {
      return {
        userId,
        feature,
        hasAccess: false,
        expiresAt: subscription.currentPeriodEnd,
        reason: `Subscription is ${subscription.status.toLowerCase()}`,
      }
    }

    // Check if period has expired
    if (!inGracePeriod && new Date() > subscription.currentPeriodEnd) {
      return {
        userId,
        feature,
        hasAccess: false,
        expiresAt: subscription.currentPeriodEnd,
        reason: 'Subscription period expired',
      }
    }

    // Get plan and check feature
    const plan = getPlanBySlug(subscription.subscriptionPlan.slug)
    if (!plan) {
      return {
        userId,
        feature,
        hasAccess: false,
        reason: 'Plan configuration not found',
      }
    }

    const hasAccess = plan.features.includes(feature)

    return {
      userId,
      feature,
      hasAccess,
      expiresAt: subscription.currentPeriodEnd,
    }
  }

  /**
   * Check: Can access premium modules
   */
  async canAccessPremiumModules(userId: string): Promise<boolean> {
    const check = await this.hasFeatureAccess(userId, 'premiumModules')
    return check.hasAccess
  }

  /**
   * Check: Can attempt unlimited mock exams
   */
  async canAttemptUnlimitedMockExams(userId: string): Promise<boolean> {
    const check = await this.hasFeatureAccess(userId, 'unlimitedMockExams')
    return check.hasAccess
  }

  /**
   * Check: Can download resources
   */
  async canDownloadResources(userId: string): Promise<boolean> {
    const check = await this.hasFeatureAccess(userId, 'downloadResources')
    return check.hasAccess
  }

  /**
   * Check: Can access learning analytics
   */
  async canAccessAnalytics(userId: string): Promise<boolean> {
    const check = await this.hasFeatureAccess(userId, 'analytics')
    return check.hasAccess
  }

  /**
   * Check: Can use AI tools (future feature)
   */
  async canUseAITutor(userId: string): Promise<boolean> {
    const check = await this.hasFeatureAccess(userId, 'aiTools')
    return check.hasAccess
  }

  async canViewAds(userId: string): Promise<boolean> {
    return !(await this.hasActiveSubscription(userId))
  }

  async hasPremiumAccess(userId: string): Promise<boolean> {
    return this.hasActiveSubscription(userId)
  }

  /**
   * Check: Has priority support
   */
  async hasPrioritySupport(userId: string): Promise<boolean> {
    const check = await this.hasFeatureAccess(userId, 'prioritySupport')
    return check.hasAccess
  }

  /**
   * Get all entitlements for a user
   */
  async getUserEntitlements(userId: string): Promise<EntitlementListDTO> {
    const subscription = await this.getUserSubscription(userId)
    const inGracePeriod = subscription?.status === 'PAST_DUE' &&
      Boolean(subscription.gracePeriodEndsAt && new Date() <= subscription.gracePeriodEndsAt)

    if (!subscription || (subscription.status !== 'ACTIVE' && !inGracePeriod)) {
      return {
        features: [],
        subscriptionStatus: subscription?.status || null,
      }
    }

    // Check if period has expired
    if (!inGracePeriod && new Date() > subscription.currentPeriodEnd) {
      return {
        features: [],
        subscriptionStatus: 'EXPIRED',
        expiresAt: subscription.currentPeriodEnd,
      }
    }

    const plan = getPlanBySlug(subscription.subscriptionPlan.slug)
    if (!plan) {
      return {
        features: [],
        subscriptionStatus: subscription.status as SubscriptionStatus,
      }
    }

    return {
      features: plan.features,
      subscriptionStatus: subscription.status as SubscriptionStatus,
      planName: plan.name,
      expiresAt: inGracePeriod ? subscription.gracePeriodEndsAt : subscription.currentPeriodEnd,
      hasPremiumAccess: true,
    }
  }

  /**
   * Check if a user has an active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) return false
    const inGracePeriod = subscription.status === 'PAST_DUE' &&
      Boolean(subscription.gracePeriodEndsAt && new Date() <= subscription.gracePeriodEndsAt)

    if (subscription.status !== 'ACTIVE' && !inGracePeriod) return false
    if (!inGracePeriod && new Date() > subscription.currentPeriodEnd) return false
    return true
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) return null

    // If the active period has expired, mark as expired
    if (subscription.status === 'PAST_DUE' && subscription.gracePeriodEndsAt && new Date() > subscription.gracePeriodEndsAt) {
      return 'EXPIRED'
    }
    if (subscription.status === 'ACTIVE' && new Date() > subscription.currentPeriodEnd) {
      return 'EXPIRED'
    }

    return subscription.status as SubscriptionStatus
  }
}

export const entitlementService = new EntitlementService()
