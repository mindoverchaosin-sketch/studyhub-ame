import { beforeEach, describe, expect, it, vi } from 'vitest'

const checkAndExpireSubscriptions = vi.hoisted(() => vi.fn())

vi.mock('@/server/domains/billing/subscriptions/subscription.service', () => ({
  subscriptionService: { checkAndExpireSubscriptions },
}))

import { runSubscriptionExpirationJob } from '@/server/domains/billing/subscriptions/subscription-expiration.job'

describe('subscription expiration job', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('delegates expiration to the subscription service', async () => {
    checkAndExpireSubscriptions.mockResolvedValue(3)

    await expect(runSubscriptionExpirationJob()).resolves.toBe(3)
    expect(checkAndExpireSubscriptions).toHaveBeenCalledOnce()
  })
})
