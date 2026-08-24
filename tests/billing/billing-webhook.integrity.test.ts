import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  eventCreate: vi.fn(),
  eventUpdate: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  subscriptionCreate: vi.fn(),
  subscriptionUpdate: vi.fn(),
  planFindUnique: vi.fn(),
  invoiceCreate: vi.fn(),
  transaction: vi.fn(),
  verifyWebhook: vi.fn(),
}))

vi.mock('@/lib/env', () => ({ env: { RAZORPAY_WEBHOOK_SECRET: 'webhook-secret' } }))
vi.mock('@/server/domains/billing/payments/payment.service', () => ({
  paymentService: { verifyWebhook: mocks.verifyWebhook },
}))
vi.mock('@/lib/prisma', () => ({
  default: { $transaction: mocks.transaction },
}))
vi.mock('@/server/domains/billing/subscriptions/subscription.service', () => ({
  subscriptionService: {},
}))
vi.mock('@/server/domains/billing/invoices/invoice.repository', () => ({
  invoiceRepository: {},
}))

const subscription = {
  id: 'sub-1',
  userId: 'user-1',
  subscriptionPlanId: 'plan-1',
  status: 'ACTIVE',
  currentPeriodEnd: new Date('2026-09-22'),
  createdAt: new Date('2026-08-22'),
  subscriptionPlan: { interval: 'monthly' },
}

function uniqueError() {
  const error = Object.create(Error.prototype) as { code: string }
  error.code = 'P2002'
  Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype)
  return error
}

function setupTransaction() {
  const tx = {
    billingWebhookEvent: { create: mocks.eventCreate, update: mocks.eventUpdate },
    subscription: { findFirst: mocks.subscriptionFindFirst, create: mocks.subscriptionCreate, update: mocks.subscriptionUpdate },
    subscriptionPlan: { findUnique: mocks.planFindUnique },
    invoice: { create: mocks.invoiceCreate },
  }
  mocks.transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx))
  mocks.planFindUnique.mockResolvedValue({
    id: 'plan-1',
    interval: 'monthly',
    productPrice: { amount: new Prisma.Decimal('499.00'), currency: 'INR' },
  })
  mocks.subscriptionCreate.mockResolvedValue(subscription)
  mocks.subscriptionUpdate.mockResolvedValue(subscription)
  mocks.invoiceCreate.mockResolvedValue({ id: 'invoice-1' })
  mocks.eventCreate.mockResolvedValue({ id: 'event-1' })
  mocks.eventUpdate.mockResolvedValue({ id: 'event-1', processingStatus: 'PROCESSED' })
  mocks.subscriptionFindFirst.mockResolvedValue(null)
}

function signedRequest(body: object, secret = 'webhook-secret') {
  const rawBody = JSON.stringify(body)
  const signature = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  return new Request('http://localhost:3000/api/billing/webhook', {
    method: 'POST',
    body: rawBody,
    headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature },
  })
}

const payload = {
  id: 'evt-1',
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay-1',
        subscription_id: 'rzp-sub-1',
        order_id: 'order-1',
        amount: 49900,
        currency: 'INR',
        notes: { userId: 'user-1', planId: 'plan-1' },
      },
    },
  },
}

describe('billing webhook integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupTransaction()
    mocks.verifyWebhook.mockResolvedValue({
      provider: 'razorpay',
      paymentId: 'pay-1',
      checkoutId: 'order-1',
      status: 'PAID',
      amount: 499,
      currency: 'INR',
      metadata: {},
      verifiedAt: new Date(),
    })
  })

  it('accepts a valid signature and stores provider identifiers', async () => {
    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload))

    expect(response.status).toBe(200)
    expect(mocks.eventCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        provider: 'razorpay',
        providerEventId: 'evt-1',
        providerPaymentId: 'pay-1',
        providerSubscriptionId: 'rzp-sub-1',
      }),
    }))
    expect(mocks.subscriptionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerSubscriptionId: 'rzp-sub-1' }),
    }))
    expect(mocks.invoiceCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerEventId: 'evt-1', providerPaymentId: 'pay-1' }),
    }))
    expect(mocks.eventUpdate).toHaveBeenCalled()
  })

  it('rejects an invalid signature before opening a transaction', async () => {
    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload, 'wrong-secret'))

    expect(response.status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.verifyWebhook).not.toHaveBeenCalled()
  })

  it('treats a duplicate provider event as a successful no-op', async () => {
    mocks.eventCreate.mockRejectedValueOnce(uniqueError())

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true, duplicate: true })
    expect(mocks.subscriptionCreate).not.toHaveBeenCalled()
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
    expect(mocks.invoiceCreate).not.toHaveBeenCalled()
  })

  it('converges a concurrent first payment on the existing active subscription', async () => {
    mocks.subscriptionCreate.mockRejectedValueOnce(uniqueError())
    mocks.subscriptionFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(subscription)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionCreate).toHaveBeenCalledTimes(1)
    expect(mocks.invoiceCreate).toHaveBeenCalledTimes(1)
  })

  it('rolls back processing when invoice creation fails', async () => {
    mocks.invoiceCreate.mockRejectedValueOnce(new Error('invoice write failed'))

    const { POST } = await import('@/app/api/billing/webhook/route')
    await expect(POST(signedRequest(payload))).rejects.toThrow('invoice write failed')
    expect(mocks.eventUpdate).not.toHaveBeenCalled()
  })

  it('moves an existing subscription to past due on failed payment', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({
      ...subscription,
      subscriptionPlan: { interval: 'monthly' },
      pastDueAt: null,
    })
    mocks.verifyWebhook.mockResolvedValueOnce({
      provider: 'razorpay', paymentId: 'pay-1', checkoutId: 'order-1', status: 'FAILED',
      amount: 499, currency: 'INR', metadata: {}, verifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({ ...payload, event: 'payment.failed' }))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'PAST_DUE',
        retryAttemptCount: { increment: 1 },
      }),
    }))
  })

  it('schedules cancellation after the paid period ends', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(subscription)
    mocks.verifyWebhook.mockResolvedValueOnce({
      provider: 'razorpay', paymentId: '', checkoutId: '', status: 'PENDING',
      amount: 0, currency: 'INR', metadata: {}, verifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-cancel',
      event: 'subscription.cancelled',
      payload: { notes: { userId: 'user-1' }, subscription: { entity: { id: 'rzp-sub-1' } } },
    }))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'sub-1' },
      data: expect.objectContaining({ cancelAtPeriodEnd: true }),
    }))
  })

  it('returns a past-due subscription to active on a successful retry', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({
      ...subscription,
      status: 'PAST_DUE',
      subscriptionPlan: { interval: 'monthly' },
      pastDueAt: new Date('2026-08-20'),
      gracePeriodEndsAt: new Date('2026-08-25'),
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({ ...payload, id: 'evt-retry' }))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'ACTIVE',
        pastDueAt: null,
        gracePeriodEndsAt: null,
        retryAttemptCount: 0,
      }),
    }))
  })

  it('grants access when the captured amount and currency exactly match the plan price', async () => {
    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true })
    expect(mocks.subscriptionCreate).toHaveBeenCalledTimes(1)
    expect(mocks.invoiceCreate).toHaveBeenCalledTimes(1)
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'PROCESSED' }),
    }))
  })

  it('rejects an underpayment without granting entitlement', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce({
      provider: 'razorpay', paymentId: 'pay-1', checkoutId: 'order-1', status: 'PAID',
      amount: 100, currency: 'INR', metadata: {}, verifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({ ...payload, id: 'evt-underpay' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: false, rejected: true, reason: 'amount_mismatch' })
    expect(mocks.subscriptionCreate).not.toHaveBeenCalled()
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
    expect(mocks.invoiceCreate).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'FAILED' }),
    }))
  })

  it('rejects an overpayment when exact-price validation is required', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce({
      provider: 'razorpay', paymentId: 'pay-1', checkoutId: 'order-1', status: 'PAID',
      amount: 999, currency: 'INR', metadata: {}, verifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({ ...payload, id: 'evt-overpay' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: false, rejected: true, reason: 'amount_mismatch' })
    expect(mocks.subscriptionCreate).not.toHaveBeenCalled()
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
    expect(mocks.invoiceCreate).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'FAILED' }),
    }))
  })

  it('rejects a currency mismatch without granting entitlement', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce({
      provider: 'razorpay', paymentId: 'pay-1', checkoutId: 'order-1', status: 'PAID',
      amount: 499, currency: 'USD', metadata: {}, verifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({ ...payload, id: 'evt-wrongccy' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: false, rejected: true, reason: 'currency_mismatch' })
    expect(mocks.subscriptionCreate).not.toHaveBeenCalled()
    expect(mocks.invoiceCreate).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'FAILED' }),
    }))
  })

  it('rejects a malformed short signature without throwing', async () => {
    const rawBody = JSON.stringify(payload)
    const request = new Request('http://localhost:3000/api/billing/webhook', {
      method: 'POST',
      body: rawBody,
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': 'abcd' },
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects an empty signature header without throwing', async () => {
    const rawBody = JSON.stringify(payload)
    const request = new Request('http://localhost:3000/api/billing/webhook', {
      method: 'POST',
      body: rawBody,
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': '' },
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})
