import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  runSubscriptionExpirationJob: vi.fn(),
  envState: { BILLING_CRON_SECRET: undefined as string | undefined },
}))

vi.mock('@/lib/env', () => ({ env: mocks.envState }))
vi.mock('@/server/domains/billing/subscriptions/subscription-expiration.job', () => ({
  runSubscriptionExpirationJob: mocks.runSubscriptionExpirationJob,
}))

import { POST } from '@/app/api/cron/billing/expire-subscriptions/route'
import { observabilityService } from '@/server/services/observability.service'

const VALID_SECRET = 'a'.repeat(32)
const WRONG_SECRET = 'b'.repeat(32)
const SHORT_SECRET = 'short'
const CRON_URL = 'https://app.test/api/cron/billing/expire-subscriptions'

function cronRequest(headers: Record<string, string> = {}) {
  return new Request(CRON_URL, { method: 'POST', headers })
}

const captureErrorSpy = vi
  .spyOn(observabilityService, 'captureError')
  .mockImplementation(() => {})

describe('billing expiration cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.envState.BILLING_CRON_SECRET = VALID_SECRET
    captureErrorSpy.mockClear()
  })

  it('runs the expiration job for a valid x-cron-secret header', async () => {
    mocks.runSubscriptionExpirationJob.mockResolvedValue(4)

    const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, expiredCount: 4 })
    expect(mocks.runSubscriptionExpirationJob).toHaveBeenCalledOnce()
  })

  it('runs the expiration job for a valid Authorization: Bearer secret', async () => {
    mocks.runSubscriptionExpirationJob.mockResolvedValue(2)

    const response = await POST(cronRequest({ Authorization: `Bearer ${VALID_SECRET}` }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, expiredCount: 2 })
    expect(mocks.runSubscriptionExpirationJob).toHaveBeenCalledOnce()
  })

  it('prefers x-cron-secret over the Bearer token when both are present', async () => {
    mocks.runSubscriptionExpirationJob.mockResolvedValue(0)

    const response = await POST(
      cronRequest({ 'x-cron-secret': VALID_SECRET, Authorization: `Bearer ${WRONG_SECRET}` }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, expiredCount: 0 })
    expect(mocks.runSubscriptionExpirationJob).toHaveBeenCalledOnce()
  })

  it('rejects a missing secret without running the job', async () => {
    const response = await POST(cronRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ success: false })
    expect(mocks.runSubscriptionExpirationJob).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret without running the job', async () => {
    const response = await POST(cronRequest({ 'x-cron-secret': WRONG_SECRET }))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ success: false })
    expect(mocks.runSubscriptionExpirationJob).not.toHaveBeenCalled()
  })

  it('fails closed with 503 when BILLING_CRON_SECRET is unset', async () => {
    mocks.envState.BILLING_CRON_SECRET = undefined

    const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ success: false })
    expect(mocks.runSubscriptionExpirationJob).not.toHaveBeenCalled()
  })

  it('fails closed with 503 when BILLING_CRON_SECRET is too short', async () => {
    mocks.envState.BILLING_CRON_SECRET = SHORT_SECRET

    const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ success: false })
    expect(mocks.runSubscriptionExpirationJob).not.toHaveBeenCalled()
  })

  it('returns a generic 500 without internal details when the job throws', async () => {
    mocks.runSubscriptionExpirationJob.mockRejectedValue(new Error('db connection refused: internal-host:5432'))

    const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toEqual({ success: false })
    const bodyText = JSON.stringify(body)
    expect(bodyText).not.toContain('db connection refused')
    expect(bodyText).not.toContain('internal-host')
    expect(captureErrorSpy).toHaveBeenCalledOnce()
    expect(mocks.runSubscriptionExpirationJob).toHaveBeenCalledOnce()
  })

  it.each([
    ['short header secret', { 'x-cron-secret': SHORT_SECRET }],
    ['empty header secret', { 'x-cron-secret': '' }],
    ['malformed authorization scheme', { Authorization: `Basic ${VALID_SECRET}` }],
    ['bearer keyword without token', { Authorization: 'Bearer' }],
    ['bearer token with extra segments', { Authorization: `Bearer ${VALID_SECRET} extra` }],
  ])('rejects %s cleanly with 401', async (_label, headers) => {
    const response = await POST(cronRequest(headers))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ success: false })
    expect(mocks.runSubscriptionExpirationJob).not.toHaveBeenCalled()
  })

  it('invokes the expiration job exactly once per authorized request', async () => {
    mocks.runSubscriptionExpirationJob.mockResolvedValue(7)

    await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

    expect(mocks.runSubscriptionExpirationJob).toHaveBeenCalledTimes(1)
  })
})
