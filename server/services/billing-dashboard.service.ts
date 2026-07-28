import { planRepository } from '@/server/domains/billing/plans/plan.repository'
import { subscriptionRepository } from '@/server/domains/billing/subscriptions/subscription.repository'
import type { SubscriptionStatus } from '@/server/domains/billing/dto/billing.dto'

function getSubscriptionPrice(subscription: any) {
  const plan = subscription.subscriptionPlan
  const directPrice = plan?.price
  if (typeof directPrice === 'number') {
    return directPrice
  }

  if (typeof directPrice === 'string') {
    const parsed = Number(directPrice)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const productPrice = plan?.productPrice?.amount
  if (typeof productPrice === 'number') {
    return productPrice
  }

  if (typeof productPrice === 'string') {
    const parsed = Number(productPrice)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export type BillingDashboardDTO = {
  overview: {
    totalSubscriptions: number
    activeSubscriptions: number
    cancelledSubscriptions: number
    expiredSubscriptions: number
    monthlyRecurringRevenue: number
    annualRecurringRevenue: number
    lifetimeSubscriptions: number
  }
  planDistribution: Record<string, number>
}

export class BillingDashboardService {
  async getBillingDashboard(): Promise<BillingDashboardDTO> {
    const [activeSubscriptions, cancelledSubscriptions, expiredSubscriptions, subscriptions, plans] = await Promise.all([
      subscriptionRepository.countByStatus('ACTIVE' as SubscriptionStatus),
      subscriptionRepository.countByStatus('CANCELLED' as SubscriptionStatus),
      subscriptionRepository.countByStatus('EXPIRED' as SubscriptionStatus),
      subscriptionRepository.findMany(),
      planRepository.findAll(),
    ])

    const planDistribution = subscriptions.reduce<Record<string, number>>((acc, subscription) => {
      const planKey = subscription.subscriptionPlan?.slug ?? 'unknown'
      acc[planKey] = (acc[planKey] ?? 0) + 1
      return acc
    }, {})

    const monthlyRecurringRevenue = subscriptions.reduce((sum, subscription) => {
      if (subscription.status !== 'ACTIVE') {
        return sum
      }

      const interval = subscription.subscriptionPlan?.interval ?? 'monthly'
      const price = getSubscriptionPrice(subscription)

      if (interval === 'yearly') {
        return sum + price / 12
      }

      if (interval === 'quarterly') {
        return sum + price / 3
      }

      if (interval === 'lifetime') {
        return sum
      }

      return sum + price
    }, 0)

    const annualRecurringRevenue = monthlyRecurringRevenue * 12

    return {
      overview: {
        totalSubscriptions: activeSubscriptions + cancelledSubscriptions + expiredSubscriptions,
        activeSubscriptions,
        cancelledSubscriptions,
        expiredSubscriptions,
        monthlyRecurringRevenue,
        annualRecurringRevenue,
        lifetimeSubscriptions: subscriptions.filter((subscription) => subscription.subscriptionPlan?.interval === 'lifetime').length,
      },
      planDistribution,
    }
  }
}

export const billingDashboardService = new BillingDashboardService()
