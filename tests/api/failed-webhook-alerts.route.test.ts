import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
  captureError: vi.fn(),
  envState: {
    BILLING_CRON_SECRET: 'a'.repeat(32) as string | undefined,
    ALERT_FAILED_WEBHOOK_THRESHOLD: undefined as number | undefined,
    ALERT_FAILED_WEBHOOK_WINDOW_MINUTES: undefined as number | undefined,
  },
}))

vi.mock('@/lib/env', () => ({ env: mocks.envState }))
vi.mock('@/lib/prisma', () => ({
  default: {
    billingWebhookEvent: {
      findMany: mocks.findMany,
      create: mocks.create,
    },
  },
}))
vi.mock('@/server/services/observability.service', () => ({
  observabilityService: { captureError: mocks.captureError },
}))

import { POST } from '@/app/api/cron/billing/failed-webhook-alerts/route'

const CRON_URL = 'https://app.test/api/cron/billing/failed-webhook-alerts'
const VALID_SECRET = 'a'.repeat(32)
const WRONG_SECRET = 'b'.repeat(32)

function cronRequest(headers: Record<string, string> = {}) {
  return new Request(CRON_URL, { method: 'POST', headers })
}

function failedEvent(n: number, eventType = 'payment.captured') {
  return {
    providerEventId: `evt-${n}`,
    eventType,
    updatedAt: new Date(`2026-08-25T10:${String(10 + n).padStart(2, '0')}:00.000Z`),
  }
}

function uniqueError() {
  const error = Object.create(Error.prototype) as { code: string }
  error.code = 'P2002'
  return error
}

describe('failed webhook alerts cron route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.envState.BILLING_CRON_SECRET = VALID_SECRET
    mocks.envState.ALERT_FAILED_WEBHOOK_THRESHOLD = undefined
    mocks.envState.ALERT_FAILED_WEBHOOK_WINDOW_MINUTES = undefined
    mocks.findMany.mockResolvedValue([])
    mocks.create.mockResolvedValue({ id: 'watermark-1' })
    mocks.captureError.mockReturnValue(undefined)
  })

  describe('authentication', () => {
    it('fails closed with 503 when BILLING_CRON_SECRET is unset', async () => {
      mocks.envState.BILLING_CRON_SECRET = undefined

      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ success: false })
      expect(mocks.findMany).not.toHaveBeenCalled()
    })

    it('rejects a wrong secret with 401 without querying', async () => {
      const response = await POST(cronRequest({ 'x-cron-secret': WRONG_SECRET }))

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ success: false })
      expect(mocks.findMany).not.toHaveBeenCalled()
    })

    it('accepts a valid x-cron-secret header', async () => {
      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

      expect(response.status).toBe(200)
      expect(mocks.findMany).toHaveBeenCalledOnce()
    })

    it('accepts a valid Authorization Bearer secret', async () => {
      const response = await POST(cronRequest({ Authorization: `Bearer ${VALID_SECRET}` }))

      expect(response.status).toBe(200)
      expect(mocks.findMany).toHaveBeenCalledOnce()
    })
  })

  describe('detection window and counting', () => {
    it('queries only razorpay FAILED events inside the rolling window, excluding ops rows', async () => {
      await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

      expect(mocks.findMany).toHaveBeenCalledTimes(1)
      const args = mocks.findMany.mock.calls[0][0]
      expect(args.where.provider).toBe('razorpay')
      expect(args.where.processingStatus).toBe('FAILED')
      expect(args.where.updatedAt.gte).toBeInstanceOf(Date)
      expect(args.where.updatedAt.gte.getTime()).toBeLessThanOrEqual(Date.now())
      expect(args.where.NOT.eventType.startsWith).toBe('ops.')
      expect(args.orderBy).toEqual({ updatedAt: 'desc' })
    })

    it('uses the configured threshold instead of the default when provided', async () => {
      mocks.envState.ALERT_FAILED_WEBHOOK_THRESHOLD = 5
      mocks.findMany.mockResolvedValue([failedEvent(1), failedEvent(2), failedEvent(3)])

      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      const json = await response.json()

      expect(json).toEqual({ success: true, alerted: false, failedCount: 3 })
      expect(mocks.captureError).not.toHaveBeenCalled()
      expect(mocks.create).not.toHaveBeenCalled()
    })

    it('applies default threshold 3 when env values are unset', async () => {
      mocks.findMany.mockResolvedValue([failedEvent(1), failedEvent(2)])
      mocks.create.mockResolvedValue({ id: 'wm' })

      const belowResponse = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      expect((await belowResponse.json()).alerted).toBe(false)

      vi.clearAllMocks()
      mocks.findMany.mockResolvedValue([failedEvent(1), failedEvent(2), failedEvent(3)])
      mocks.create.mockResolvedValue({ id: 'wm' })

      const atResponse = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      expect((await atResponse.json()).alerted).toBe(true)
    })

    it('derives the rolling window start from the configured window minutes', async () => {
      mocks.envState.ALERT_FAILED_WEBHOOK_WINDOW_MINUTES = 15
      const before = Date.now()

      await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

      const gte = mocks.findMany.mock.calls[0][0].where.updatedAt.gte.getTime() as number
      expect(gte).toBeGreaterThanOrEqual(before - 15 * 60 * 1000)
      expect(gte).toBeLessThanOrEqual(Date.now() - 15 * 60 * 1000)
    })
  })

  describe('below threshold', () => {
    it('returns alerted:false without emitting or watermarking', async () => {
      mocks.findMany.mockResolvedValue([failedEvent(1)])

      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toEqual({ success: true, alerted: false, failedCount: 1 })
      expect(mocks.captureError).not.toHaveBeenCalled()
      expect(mocks.create).not.toHaveBeenCalled()
    })
  })

  describe('threshold reached', () => {
    beforeEach(() => {
      mocks.findMany.mockResolvedValue([
        failedEvent(3),
        failedEvent(2, 'payment.failed'),
        failedEvent(1, 'order.paid'),
      ])
    })

    it('emits one critical alert with exact metadata shape and writes the watermark', async () => {
      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.alerted).toBe(true)

      expect(mocks.captureError).toHaveBeenCalledTimes(1)
      const [error, details] = mocks.captureError.mock.calls[0]
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('Repeated FAILED billing webhook events detected')
      expect(details.service).toBe('billing')
      expect(details.operation).toBe('failed-webhook-alert')
      expect(details.severity).toBe('critical')
      expect(details.metadata.threshold).toBe(3)
      expect(details.metadata.windowMinutes).toBe(60)
      expect(details.metadata.provider).toBe('razorpay')
      expect(details.metadata.failures).toHaveLength(3)
      // No fabricated failure reasons: only fields the model actually stores.
      for (const failure of details.metadata.failures) {
        expect(Object.keys(failure).sort()).toEqual(['eventType', 'providerEventId', 'updatedAt'])
      }

      expect(mocks.create).toHaveBeenCalledTimes(1)
      const createArgs = mocks.create.mock.calls[0][0]
      expect(createArgs.data.provider).toBe('razorpay')
      expect(createArgs.data.eventType).toBe('ops.failedWebhookAlert')
      expect(createArgs.data.processingStatus).toBe('PROCESSED')
      expect(createArgs.data.providerEventId).toMatch(/^ops-failed-alert-\d+$/)
      expect(createArgs.data.processedAt).toBeInstanceOf(Date)
    })

    it('treats a P2002 watermark conflict as already-alerted without failing', async () => {
      mocks.create.mockRejectedValue(uniqueError())

      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.alerted).toBe(true)
      // The single emission for this run stands; no retry storm.
      expect(mocks.captureError).toHaveBeenCalledTimes(1)
    })

    it('keeps the run green when a non-conflict watermark write fails', async () => {
      mocks.create.mockRejectedValue(new Error('write timeout'))

      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

      expect(response.status).toBe(200)
      expect((await response.json()).alerted).toBe(true)
      // The watermark failure is captured at low severity, separately.
      expect(mocks.captureError).toHaveBeenCalledTimes(2)
      expect(mocks.captureError.mock.calls[1][1]).toMatchObject({
        operation: 'failed-webhook-alert-watermark',
        severity: 'low',
      })
    })

    it('still responds successfully when captureError itself throws', async () => {
      mocks.captureError.mockImplementation(() => {
        throw new Error('sink exploded')
      })

      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.alerted).toBe(true)
      expect(mocks.create).toHaveBeenCalledOnce()
    })

    it('never exposes event payloads in the HTTP response', async () => {
      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))
      const raw = JSON.stringify(await response.json())

      expect(raw).not.toContain('evt-')
      expect(raw).not.toContain('payment.captured')
      expect(raw).not.toContain('ops-failed-alert')
    })
  })

  describe('infrastructure failure', () => {
    it('returns a controlled 500 when the detection query fails', async () => {
      mocks.findMany.mockRejectedValue(new Error('db down'))

      const response = await POST(cronRequest({ 'x-cron-secret': VALID_SECRET }))

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ success: false })
      expect(mocks.captureError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'db down' }),
        expect.objectContaining({ service: 'billing', severity: 'high' }),
      )
      expect(mocks.create).not.toHaveBeenCalled()
    })
  })
})
