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
  billingWebhookEventUpsert: vi.fn(),
  captureError: vi.fn(),
}))

vi.mock('@/lib/env', () => ({ env: { RAZORPAY_WEBHOOK_SECRET: 'webhook-secret' } }))
vi.mock('@/server/domains/billing/payments/payment.service', () => ({
  paymentService: { verifyWebhook: mocks.verifyWebhook },
}))
vi.mock('@/lib/prisma', () => ({
  default: {
    $transaction: mocks.transaction,
    billingWebhookEvent: { upsert: mocks.billingWebhookEventUpsert },
  },
}))
vi.mock('@/server/services/observability.service', () => ({
  observabilityService: { captureError: mocks.captureError },
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
  mocks.billingWebhookEventUpsert.mockResolvedValue({ id: 'event-1', processingStatus: 'FAILED' })
  mocks.captureError.mockReturnValue(undefined)
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

  it('rolls back processing on invoice failure but persists a durable FAILED marker', async () => {
    mocks.invoiceCreate.mockRejectedValueOnce(new Error('invoice write failed'))

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ success: false })
    // Transaction rolled back: no PROCESSED transition ever happened.
    expect(mocks.eventUpdate).not.toHaveBeenCalled()
    // Yet the failure remains durably queryable.
    expect(mocks.billingWebhookEventUpsert).toHaveBeenCalledTimes(1)
    expect(mocks.billingWebhookEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { provider_providerEventId: { provider: 'razorpay', providerEventId: 'evt-1' } },
      create: expect.objectContaining({
        eventType: 'payment.captured',
        processingStatus: 'FAILED',
        providerPaymentId: 'pay-1',
        providerSubscriptionId: 'rzp-sub-1',
      }),
      update: expect.objectContaining({ processingStatus: 'FAILED' }),
    }))
    expect(mocks.captureError).toHaveBeenCalledOnce()
    expect(mocks.captureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'invoice write failed' }),
      expect.objectContaining({ service: 'billing', operation: 'razorpay-webhook' }),
    )
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

  it('cancels the provider-scoped row instead of a newer same-user subscription', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(subscription)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-cancel-provider',
      event: 'subscription.cancelled',
      payload: { notes: { userId: 'user-1' }, subscription: { entity: { id: 'rzp-sub-1' } } },
    }))

    expect(response.status).toBe(200)
    // Strict provider lookup only: never OR-widened with userId and never
    // reordered by createdAt, so a newer unrelated row cannot win.
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledTimes(1)
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledWith({ where: { providerSubscriptionId: 'rzp-sub-1' } })
    // No stamping: the update must carry exactly cancelAtPeriodEnd.
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { cancelAtPeriodEnd: true },
    })
  })

  it('fails closed when the cancelled provider subscription belongs to another account', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({ ...subscription, userId: 'victim-user' })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-cancel-foreign',
      event: 'subscription.cancelled',
      payload: { notes: { userId: 'user-1' }, subscription: { entity: { id: 'rzp-sub-1' } } },
    }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ success: false })
    expect(mocks.captureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cancelled provider subscription belongs to a different account.' }),
      expect.objectContaining({ service: 'billing', operation: 'razorpay-webhook' }),
    )
    expect(mocks.billingWebhookEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { provider_providerEventId: { provider: 'razorpay', providerEventId: 'evt-cancel-foreign' } },
      create: expect.objectContaining({
        processingStatus: 'FAILED',
        providerSubscriptionId: 'rzp-sub-1',
      }),
      update: expect.objectContaining({ processingStatus: 'FAILED' }),
    }))
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).not.toHaveBeenCalled()
  })

  it('treats an unknown provider subscription as a no-op without falling back to userId', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(null)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-cancel-unknown',
      event: 'subscription.cancelled',
      payload: { notes: { userId: 'user-1' }, subscription: { entity: { id: 'rzp-sub-missing' } } },
    }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true, action: 'subscriptionCancelled' })
    // Exactly one strict lookup proves no userId fallback query occurred.
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledTimes(1)
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledWith({ where: { providerSubscriptionId: 'rzp-sub-missing' } })
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'PROCESSED' }),
    }))
  })

  it('keeps the newest-by-user fallback when the cancellation carries no provider id', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(subscription)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-cancel-metadata-only',
      event: 'subscription.cancelled',
      payload: { notes: { userId: 'user-1' } },
    }))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    })
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { cancelAtPeriodEnd: true },
    })
  })

  it('rejects a cancellation without user metadata before touching subscriptions', async () => {
    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-cancel-no-user',
      event: 'subscription.cancelled',
      payload: { subscription: { entity: { id: 'rzp-sub-1' } } },
    }))

    expect(response.status).toBe(400)
    expect(mocks.subscriptionFindFirst).not.toHaveBeenCalled()
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
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

  it('returns a controlled 500 and FAILED marker when an unexpected error occurs', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(subscription)
    mocks.subscriptionUpdate.mockRejectedValueOnce(new Error('renewal write exploded'))

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ success: false })
    expect(mocks.captureError).toHaveBeenCalledOnce()
    expect(mocks.invoiceCreate).not.toHaveBeenCalled()
    expect(mocks.billingWebhookEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { provider_providerEventId: { provider: 'razorpay', providerEventId: 'evt-1' } },
      create: expect.objectContaining({ processingStatus: 'FAILED' }),
      update: expect.objectContaining({ processingStatus: 'FAILED' }),
    }))
  })

  it('persists a FAILED marker for missing plan metadata while keeping the 400 contract', async () => {
    mocks.planFindUnique.mockResolvedValue(null)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest(payload))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Plan not found: plan-1' })
    expect(mocks.subscriptionCreate).not.toHaveBeenCalled()
    expect(mocks.billingWebhookEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { provider_providerEventId: { provider: 'razorpay', providerEventId: 'evt-1' } },
      update: expect.objectContaining({ processingStatus: 'FAILED' }),
    }))
  })

  it('resolves entity-level notes for fully nested subscription.cancelled payloads', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue({ ...subscription, userId: 'user-1' })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-cancel-nested',
      event: 'subscription.cancelled',
      payload: {
        subscription: {
          entity: {
            id: 'rzp-sub-nested',
            notes: { userId: 'user-1' },
          },
        },
      },
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: true, action: 'subscriptionCancelled' })
    // Notes were found inside subscription.entity, not at the payload root.
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledWith({ where: { providerSubscriptionId: 'rzp-sub-nested' } })
    expect(mocks.subscriptionUpdate).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { cancelAtPeriodEnd: true },
    })
    expect(mocks.billingWebhookEventUpsert).not.toHaveBeenCalled()
  })

  it('records both provider identifiers for subscription.charged events', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(null)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-charged',
      event: 'subscription.charged',
      payload: {
        payment: {
          entity: {
            id: 'pay-chg-1',
            subscription_id: 'rzp-sub-9',
            amount: 49900,
            currency: 'INR',
            notes: { userId: 'user-1', planId: 'plan-1' },
          },
        },
        subscription: {
          entity: { id: 'rzp-sub-9' },
        },
      },
    }))

    expect(response.status).toBe(200)
    expect(mocks.eventCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        providerPaymentId: 'pay-chg-1',
        providerSubscriptionId: 'rzp-sub-9',
        eventType: 'subscription.charged',
      }),
    }))
    expect(mocks.subscriptionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ providerSubscriptionId: 'rzp-sub-9', status: 'ACTIVE' }),
    }))
  })

  it('grants access for payment_link.paid even when verification reports PENDING', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce({
      provider: 'razorpay', paymentId: 'plink-1', checkoutId: '', status: 'PENDING',
      amount: 499, currency: 'INR', metadata: {}, verifiedAt: new Date(),
    })

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-plink',
      event: 'payment_link.paid',
      payload: {
        payment_link: {
          entity: {
            id: 'plink-1',
            amount: 49900,
            currency: 'INR',
            notes: { userId: 'user-1', planId: 'plan-1' },
          },
        },
      },
    }))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'ACTIVE' }),
    }))
    expect(mocks.invoiceCreate).toHaveBeenCalledOnce()
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'PROCESSED' }),
    }))
  })

  it('treats order.paid as a captured payment and grants access', async () => {
    mocks.subscriptionFindFirst.mockResolvedValue(null)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-order-paid',
      event: 'order.paid',
      payload: {
        payment: {
          entity: {
            id: 'pay-order-1',
            order_id: 'order-1',
            amount: 49900,
            currency: 'INR',
            notes: { userId: 'user-1', planId: 'plan-1' },
          },
        },
      },
    }))

    expect(response.status).toBe(200)
    expect(mocks.subscriptionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'ACTIVE' }),
    }))
    expect(mocks.invoiceCreate).toHaveBeenCalledOnce()
  })

  it('treats unknown paid-looking events as a processed no-op without mutations', async () => {
    mocks.verifyWebhook.mockResolvedValueOnce({
      provider: 'razorpay', paymentId: 'pay-settle-1', checkoutId: '', status: 'PENDING',
      amount: 499, currency: 'INR', metadata: {}, verifiedAt: new Date(),
    })
    mocks.subscriptionFindFirst.mockResolvedValue(subscription)

    const { POST } = await import('@/app/api/billing/webhook/route')
    const response = await POST(signedRequest({
      id: 'evt-foo-paid',
      event: 'settlement.paid',
      payload: {
        payment: {
          entity: {
            id: 'pay-settle-1',
            amount: 49900,
            currency: 'INR',
            notes: { userId: 'user-1', planId: 'plan-1' },
          },
        },
      },
    }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({ success: true, status: 'PENDING' })
    expect(mocks.subscriptionCreate).not.toHaveBeenCalled()
    expect(mocks.subscriptionUpdate).not.toHaveBeenCalled()
    expect(mocks.invoiceCreate).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ processingStatus: 'PROCESSED' }),
    }))
  })
})
