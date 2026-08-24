import { subscriptionService } from '@/server/domains/billing/subscriptions/subscription.service'

export async function runSubscriptionExpirationJob(): Promise<number> {
  return subscriptionService.checkAndExpireSubscriptions()
}
