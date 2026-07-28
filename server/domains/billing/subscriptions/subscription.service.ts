/**
 * SubscriptionService
 * 
 * Manages subscription lifecycle:
 * - Create new subscription
 * - Activate subscription
 * - Upgrade/downgrade plan
 * - Renew subscription
 * - Expire subscription
 * - Cancel subscription
 * 
 * Returns DTOs only. No payment processing.
 */

import { subscriptionRepository } from '@/server/domains/billing/subscriptions/subscription.repository'
import { invoiceRepository } from '@/server/domains/billing/invoices/invoice.repository'
import { planRepository } from '@/server/domains/billing/plans/plan.repository'
import { getPlanBySlug, getPlanById } from '@/server/domains/billing/plans/plan.config'
import type { SubscriptionDTO } from '@/server/domains/billing/dto/billing.dto'

export class SubscriptionService {
  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string,
    planId: string,
    startDate: Date = new Date()
  ): Promise<SubscriptionDTO> {
    const subscriptionPlan = await planRepository.findById(planId)
    if (!subscriptionPlan) {
      throw new Error(`Plan not found: ${planId}`)
    }

    // Calculate period end based on plan interval
    const periodEnd = this.calculatePeriodEnd(startDate, subscriptionPlan.interval)

    const subscription = await subscriptionRepository.create({
      user: { connect: { id: userId } },
      subscriptionPlan: { connect: { id: planId } },
      status: 'ACTIVE',
      currentPeriodStart: startDate,
      currentPeriodEnd: periodEnd,
      renewalAttempts: 0,
    })

    return this.mapToDTO(subscription)
  }

  /**
   * Upgrade subscription to a higher plan
   */
  async upgradePlan(userId: string, newPlanId: string): Promise<SubscriptionDTO> {
    const currentSubscription = await subscriptionRepository.findByUserId(userId)
    if (!currentSubscription) {
      throw new Error(`No active subscription for user: ${userId}`)
    }

    const newPlan = await planRepository.findById(newPlanId)
    if (!newPlan) {
      throw new Error(`Plan not found: ${newPlanId}`)
    }

    // Update subscription with new plan
    const upgraded = await subscriptionRepository.update(currentSubscription.id, {
      subscriptionPlan: { connect: { id: newPlanId } },
      // Keep current period, charge difference on next renewal
    })

    return this.mapToDTO(upgraded)
  }

  /**
   * Downgrade subscription to a lower plan
   */
  async downgradePlan(userId: string, newPlanId: string): Promise<SubscriptionDTO> {
    const currentSubscription = await subscriptionRepository.findByUserId(userId)
    if (!currentSubscription) {
      throw new Error(`No active subscription for user: ${userId}`)
    }

    const newPlan = await planRepository.findById(newPlanId)
    if (!newPlan) {
      throw new Error(`Plan not found: ${newPlanId}`)
    }

    // Downgrade effective next renewal
    const downgraded = await subscriptionRepository.update(currentSubscription.id, {
      subscriptionPlan: { connect: { id: newPlanId } },
      // Downgrade takes effect at next renewal
    })

    return this.mapToDTO(downgraded)
  }

  /**
   * Renew an expired subscription
   */
  async renewSubscription(userId: string): Promise<SubscriptionDTO> {
    const subscription = await subscriptionRepository.findByUserId(userId)
    if (!subscription) {
      throw new Error(`No subscription for user: ${userId}`)
    }

    const now = new Date()
    const periodEnd = this.calculatePeriodEnd(now, subscription.subscriptionPlan.interval)

    const renewed = await subscriptionRepository.update(subscription.id, {
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      renewalAttempts: 0,
    })

    return this.mapToDTO(renewed)
  }

  /**
   * Expire a subscription (called when period ends)
   */
  async expireSubscription(subscriptionId: string): Promise<SubscriptionDTO> {
    const expired = await subscriptionRepository.expire(subscriptionId)
    return this.mapToDTO(expired)
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<SubscriptionDTO> {
    const cancelled = await subscriptionRepository.cancel(subscriptionId)
    return this.mapToDTO(cancelled)
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<SubscriptionDTO> {
    const paused = await subscriptionRepository.update(subscriptionId, {
      status: 'PAUSED',
    })
    return this.mapToDTO(paused)
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<SubscriptionDTO> {
    const subscription = await subscriptionRepository.findById(subscriptionId)
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`)
    }

    // Extend period if it has already expired
    let newEnd = subscription.currentPeriodEnd
    if (new Date() > newEnd) {
      newEnd = this.calculatePeriodEnd(new Date(), subscription.subscriptionPlan.interval)
    }

    const resumed = await subscriptionRepository.update(subscriptionId, {
      status: 'ACTIVE',
      currentPeriodEnd: newEnd,
    })

    return this.mapToDTO(resumed)
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionDTO | null> {
    const subscription = await subscriptionRepository.findById(subscriptionId)
    return subscription ? this.mapToDTO(subscription) : null
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<SubscriptionDTO | null> {
    const subscription = await subscriptionRepository.findByUserId(userId)
    return subscription ? this.mapToDTO(subscription) : null
  }

  /**
   * Check expiring subscriptions and auto-expire if needed
   * (Called by a cron job)
   */
  async checkAndExpireSubscriptions(): Promise<number> {
    const expiredSubs = await subscriptionRepository.findExpiredSubscriptions()
    let count = 0

    for (const sub of expiredSubs) {
      await this.expireSubscription(sub.id)
      count++
    }

    return count
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    const activeCount = await subscriptionRepository.countActiveSubscriptions()
    const expiredCount = await subscriptionRepository.countByStatus('EXPIRED')
    const cancelledCount = await subscriptionRepository.countByStatus('CANCELLED')
    const pausedCount = await subscriptionRepository.countByStatus('PAUSED')

    return {
      active: activeCount,
      expired: expiredCount,
      cancelled: cancelledCount,
      paused: pausedCount,
      total: activeCount + expiredCount + cancelledCount + pausedCount,
    }
  }

  /**
   * Helper: Calculate period end date based on plan interval
   */
  private calculatePeriodEnd(startDate: Date, interval: string): Date {
    const end = new Date(startDate)

    switch (interval.toLowerCase()) {
      case 'monthly':
        end.setMonth(end.getMonth() + 1)
        break
      case 'quarterly':
        end.setMonth(end.getMonth() + 3)
        break
      case 'yearly':
        end.setFullYear(end.getFullYear() + 1)
        break
      case 'lifetime':
        // Far future date for lifetime
        end.setFullYear(end.getFullYear() + 100)
        break
      default:
        end.setMonth(end.getMonth() + 1) // Default to monthly
    }

    return end
  }

  /**
   * Helper: Map Prisma subscription to DTO
   */
  private mapToDTO(subscription: any): SubscriptionDTO {
    return {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.subscriptionPlanId,
      planName: subscription.subscriptionPlan.name,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewalAttempts: subscription.renewalAttempts,
      cancelledAt: subscription.cancelledAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    }
  }
}

export const subscriptionService = new SubscriptionService()
