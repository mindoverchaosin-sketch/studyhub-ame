import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { paymentService } from '@/server/domains/billing/payments/payment.service'
import { subscriptionService } from '@/server/domains/billing/subscriptions/subscription.service'
import { invoiceRepository } from '@/server/domains/billing/invoices/invoice.repository'

function verifyRazorpaySignature(payload: string, signature: string) {
  if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex')

  return expectedSignature === signature
}

function getWebhookData(body: any) {
  return (
    body?.payload?.payment?.entity ||
    body?.payload?.payment_link?.entity ||
    body?.payload?.entity ||
    body?.payload ||
    body
  )
}

function parseString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return undefined
}

function isPaymentCaptured(event: string) {
  return event.includes('captured') || event.includes('paid') || event.includes('payment_link.paid')
}

function isPaymentFailed(event: string) {
  return event.includes('failed') || event.includes('payment.failed')
}

function isSubscriptionCancelled(event: string) {
  return event.includes('subscription.cancelled') || event.includes('subscription.canceled')
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  if (!verifyRazorpaySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
  }

  const event = parseString(body.event) ?? 'unknown'
  const data = getWebhookData(body)
  const payload = {
    provider: 'razorpay',
    event,
    data,
    signature,
    receivedAt: new Date(),
  }

  const verification = await paymentService.verifyWebhook(payload)
  const notes = (data?.notes ?? {}) as Record<string, unknown>
  const userId = parseString(notes.userId ?? notes.user_id ?? data['userId'] ?? data['user_id'])
  const planId = parseString(notes.planId ?? notes.plan_id ?? data['planId'] ?? data['plan_id'])

  if (isSubscriptionCancelled(event)) {
    if (!userId) {
      return NextResponse.json({ error: 'Missing user metadata for subscription cancellation.' }, { status: 400 })
    }

    const existingSubscription = await subscriptionService.getUserSubscription(userId)
    if (existingSubscription) {
      await subscriptionService.cancelSubscription(existingSubscription.id)
    }

    return NextResponse.json({ success: true, event, action: 'subscriptionCancelled' })
  }

  if (!userId || !planId) {
    return NextResponse.json({ error: 'Missing subscription metadata in webhook payload.' }, { status: 400 })
  }

  const existingSubscription = await subscriptionService.getUserSubscription(userId)

  if (isPaymentFailed(event) || verification.status === 'FAILED') {
    const invoice = await invoiceRepository.create({
      subscription: { connect: { id: existingSubscription?.id ?? undefined } },
      invoiceNumber: `INV-FAILED-${Date.now()}`,
      status: 'FAILED',
      dueDate: new Date(),
      paidAt: null,
      amount: verification.amount.toFixed(2),
      currency: verification.currency,
      description: `Failed subscription payment for ${planId}`,
      metadata: {
        provider: verification.provider,
        event,
        paymentId: verification.paymentId,
        raw: verification.metadata,
      } as Prisma.InputJsonValue,
    })

    return NextResponse.json({ success: true, status: 'FAILED', invoiceId: invoice.id })
  }

  if (!isPaymentCaptured(event) && verification.status !== 'PAID') {
    return NextResponse.json({ success: true, status: verification.status })
  }

  let subscription = existingSubscription

  if (!existingSubscription) {
    subscription = await subscriptionService.createSubscription(userId, planId)
  } else if (existingSubscription.planId !== planId) {
    subscription = await subscriptionService.upgradePlan(userId, planId)
  } else if (new Date() > existingSubscription.currentPeriodEnd) {
    subscription = await subscriptionService.renewSubscription(userId, new Date())
  } else {
    subscription = await subscriptionService.renewSubscription(userId, existingSubscription.currentPeriodEnd)
  }

  const invoice = await invoiceRepository.create({
    subscription: { connect: { id: subscription.id } },
    invoiceNumber: `INV-${Date.now()}`,
    status: 'PAID',
    dueDate: new Date(),
    paidAt: new Date(),
    amount: verification.amount.toFixed(2),
    currency: verification.currency,
    description: `Subscription payment for ${planId}`,
    metadata: {
      provider: verification.provider,
      event,
      paymentId: verification.paymentId,
      raw: verification.metadata,
    } as Prisma.InputJsonValue,
  })

  return NextResponse.json({ success: true, subscriptionId: subscription.id, invoiceId: invoice.id })
}
