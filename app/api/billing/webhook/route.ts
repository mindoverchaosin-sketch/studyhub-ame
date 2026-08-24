import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import prisma from '@/lib/prisma'
import { paymentService } from '@/server/domains/billing/payments/payment.service'

function verifyRazorpaySignature(payload: string, signature: string) {
  if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex')

  // Length-guard before timingSafeEqual: it throws on unequal buffer sizes,
  // and malformed signatures must reject cleanly instead of throwing.
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
  const signatureBuffer = Buffer.from(signature, 'utf8')
  if (expectedBuffer.length === 0 || signatureBuffer.length === 0) {
    return false
  }
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
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

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

/**
 * Reconciles the captured payment against the server-side plan price.
 *
 * The webhook payload amount is NEVER trusted as the expected price: the
 * authoritative figure comes from the plan's ProductPrice row (the same
 * source checkout uses). Razorpay amounts are subunits (paise), so both
 * sides are compared as integer paise. The contract is exact-price: any
 * underpayment or overpayment, or a currency mismatch, rejects the grant.
 */
function reconcilePaymentAmount(
  verificationAmountMajor: number,
  verificationCurrency: string,
  productPrice: { amount: Prisma.Decimal | number | string; currency?: string | null } | null | undefined,
): { ok: true } | { ok: false; reason: 'amount_mismatch' | 'currency_mismatch' } {
  const expectedCurrency = (productPrice?.currency ?? 'INR').toUpperCase()
  if (verificationCurrency.toUpperCase() !== expectedCurrency) {
    return { ok: false, reason: 'currency_mismatch' }
  }

  const expectedAmountPaise = Math.round(Number(productPrice?.amount ?? NaN) * 100)
  const paidAmountPaise = Math.round(verificationAmountMajor * 100)

  if (!Number.isFinite(expectedAmountPaise) || !Number.isFinite(paidAmountPaise)) {
    return { ok: false, reason: 'amount_mismatch' }
  }

  return paidAmountPaise === expectedAmountPaise ? { ok: true } : { ok: false, reason: 'amount_mismatch' }
}

function getProviderEventId(body: any, request: Request) {
  return parseString(body?.id ?? body?.event_id ?? request.headers.get('x-razorpay-event-id'))
}

function getProviderPaymentId(data: any) {
  return parseString(data?.id ?? data?.payment_id ?? data?.paymentId ?? data?.entity?.id)
}

function getProviderSubscriptionId(body: any, data: any) {
  return parseString(
    data?.subscription_id ??
      data?.subscriptionId ??
      data?.subscription?.id ??
      body?.payload?.subscription?.entity?.id,
  )
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
  const providerEventId = getProviderEventId(body, request)
  const providerPaymentId = getProviderPaymentId(data)
  const providerSubscriptionId = getProviderSubscriptionId(body, data)

  if (!providerEventId) {
    return NextResponse.json({ error: 'Missing provider event ID.' }, { status: 400 })
  }

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

  try {
    const result = await prisma.$transaction(async (tx) => {
      try {
        await tx.billingWebhookEvent.create({
          data: {
            provider: 'razorpay',
            providerEventId,
            eventType: event,
            providerPaymentId,
            providerSubscriptionId,
            processingStatus: 'RECEIVED',
          },
        })
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return { duplicate: true as const }
        }
        throw error
      }

      if (isSubscriptionCancelled(event)) {
        if (!userId) {
          throw new Error('Missing user metadata for subscription cancellation.')
        }

        // Cancellation scoping: a provider subscription id maps to exactly one
        // row globally (@@unique on providerSubscriptionId) and must never be
        // OR-widened with userId — otherwise createdAt desc could select and
        // cancel an unrelated newer row, possibly owned by another account.
        const existingSubscription = providerSubscriptionId
          ? await tx.subscription.findFirst({ where: { providerSubscriptionId } })
          : await tx.subscription.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })

        if (existingSubscription && providerSubscriptionId && existingSubscription.userId !== userId) {
          // Signed event metadata disagrees with row ownership: fail closed,
          // roll the transaction back, and leave the webhook event unprocessed.
          throw new Error('Cancelled provider subscription belongs to a different account.')
        }

        if (existingSubscription) {
          await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: { cancelAtPeriodEnd: true },
          })
        }

        await tx.billingWebhookEvent.update({
          where: { provider_providerEventId: { provider: 'razorpay', providerEventId } },
          data: { processingStatus: 'PROCESSED', processedAt: new Date() },
        })
        return { duplicate: false as const, action: 'subscriptionCancelled' as const }
      }

      if (!userId || !planId) {
        throw new Error('Missing subscription metadata in webhook payload.')
      }

      const existingSubscription = await tx.subscription.findFirst({
        where: { userId },
        include: { subscriptionPlan: true },
        orderBy: { createdAt: 'desc' },
      })

      if (isPaymentFailed(event) || verification.status === 'FAILED') {
        if (existingSubscription) {
          const attemptedAt = new Date()
          const gracePeriodEndsAt = new Date(attemptedAt)
          gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + (existingSubscription.subscriptionPlan.interval.toLowerCase() === 'yearly' ? 7 : 3))
          await tx.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'PAST_DUE',
              pastDueAt: existingSubscription.pastDueAt ?? attemptedAt,
              gracePeriodEndsAt,
              lastPaymentAttemptAt: attemptedAt,
              retryAttemptCount: { increment: 1 },
              providerSubscriptionId,
            },
          })
        }

        if (!existingSubscription) {
          await tx.billingWebhookEvent.update({
            where: { provider_providerEventId: { provider: 'razorpay', providerEventId } },
            data: { processingStatus: 'PROCESSED', processedAt: new Date() },
          })
          return { duplicate: false as const, status: 'FAILED' as const }
        }

        const invoice = await tx.invoice.create({
          data: {
            subscription: { connect: { id: existingSubscription?.id } },
            invoiceNumber: `INV-FAILED-${Date.now()}`,
            providerEventId,
            providerPaymentId,
            status: 'FAILED',
            dueDate: new Date(),
            paidAt: null,
            amount: verification.amount.toFixed(2),
            currency: verification.currency,
            description: `Failed subscription payment for ${planId}`,
            metadata: { provider: verification.provider, event, paymentId: verification.paymentId, raw: verification.metadata } as Prisma.InputJsonValue,
          },
        })
        await tx.billingWebhookEvent.update({
          where: { provider_providerEventId: { provider: 'razorpay', providerEventId } },
          data: { processingStatus: 'PROCESSED', processedAt: new Date() },
        })
        return { duplicate: false as const, status: 'FAILED' as const, invoiceId: invoice.id }
      }

      if (!isPaymentCaptured(event) && verification.status !== 'PAID') {
        await tx.billingWebhookEvent.update({
          where: { provider_providerEventId: { provider: 'razorpay', providerEventId } },
          data: { processingStatus: 'PROCESSED', processedAt: new Date() },
        })
        return { duplicate: false as const, status: verification.status }
      }

      const plan = await tx.subscriptionPlan.findUnique({ where: { id: planId }, include: { productPrice: true } })
      if (!plan) throw new Error(`Plan not found: ${planId}`)

      // Amount reconciliation gate: no subscription state or invoice may be
      // written unless the captured payment exactly matches the server-side
      // plan price and currency.
      const reconciliation = reconcilePaymentAmount(
        verification.amount,
        verification.currency ?? 'INR',
        plan.productPrice,
      )
      if (!reconciliation.ok) {
        await tx.billingWebhookEvent.update({
          where: { provider_providerEventId: { provider: 'razorpay', providerEventId } },
          data: { processingStatus: 'FAILED', processedAt: new Date() },
        })
        return { duplicate: false as const, rejected: true as const, reason: reconciliation.reason }
      }

      const now = new Date()
      let subscription
      if (!existingSubscription) {
        const periodEnd = calculatePeriodEnd(now, plan.interval)
        try {
          subscription = await tx.subscription.create({
            data: {
              user: { connect: { id: userId } },
              subscriptionPlan: { connect: { id: planId } },
              providerSubscriptionId,
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              renewalAttempts: 0,
            },
          })
        } catch (error) {
          if (!isUniqueConstraintError(error)) throw error
          subscription = await tx.subscription.findFirst({
            where: { userId, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
          })
          if (!subscription) throw error
        }
      } else if (existingSubscription.subscriptionPlanId !== planId) {
        const updateData: any = { subscriptionPlan: { connect: { id: planId } }, providerSubscriptionId }
        if (existingSubscription.status !== 'ACTIVE' || now > existingSubscription.currentPeriodEnd) {
          updateData.status = 'ACTIVE'
          updateData.currentPeriodStart = now
          updateData.currentPeriodEnd = calculatePeriodEnd(now, plan.interval)
          updateData.renewalAttempts = 0
        }
        subscription = await tx.subscription.update({ where: { id: existingSubscription.id }, data: updateData })
      } else {
        const renewalStart = now > existingSubscription.currentPeriodEnd ? now : existingSubscription.currentPeriodEnd
        subscription = await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: renewalStart,
            currentPeriodEnd: calculatePeriodEnd(renewalStart, plan.interval),
            renewalAttempts: 0,
            providerSubscriptionId,
            cancelAtPeriodEnd: false,
            scheduledPlanId: null,
            scheduledPlanEffectiveAt: null,
            pastDueAt: null,
            gracePeriodEndsAt: null,
            lastPaymentAttemptAt: null,
            retryAttemptCount: 0,
          },
        })
      }

      const invoice = await tx.invoice.create({
        data: {
          subscription: { connect: { id: subscription.id } },
          invoiceNumber: `INV-${Date.now()}`,
          providerEventId,
          providerPaymentId,
          status: 'PAID',
          dueDate: new Date(),
          paidAt: new Date(),
          amount: verification.amount.toFixed(2),
          currency: verification.currency,
          description: `Subscription payment for ${planId}`,
          metadata: { provider: verification.provider, event, paymentId: verification.paymentId, raw: verification.metadata } as Prisma.InputJsonValue,
        },
      })
      await tx.billingWebhookEvent.update({
        where: { provider_providerEventId: { provider: 'razorpay', providerEventId } },
        data: { processingStatus: 'PROCESSED', processedAt: new Date() },
      })
      return { duplicate: false as const, subscriptionId: subscription.id, invoiceId: invoice.id }
    })

    if (result.duplicate) return NextResponse.json({ success: true, duplicate: true, event })
    if ('action' in result) return NextResponse.json({ success: true, event, action: result.action })
    if ('rejected' in result && result.rejected) {
      return NextResponse.json({ success: false, rejected: true, reason: result.reason, event })
    }
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Missing ') || error.message.startsWith('Plan not found'))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}

function calculatePeriodEnd(startDate: Date, interval: string) {
  const end = new Date(startDate)
  switch (interval.toLowerCase()) {
    case 'quarterly': end.setMonth(end.getMonth() + 3); break
    case 'yearly': end.setFullYear(end.getFullYear() + 1); break
    case 'lifetime': end.setFullYear(end.getFullYear() + 100); break
    default: end.setMonth(end.getMonth() + 1)
  }
  return end
}
