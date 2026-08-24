import Razorpay from 'razorpay'
import { env } from '@/lib/env'
import type {
  CheckoutRequestDTO,
  CheckoutResponseDTO,
  PaymentVerificationDTO,
  WebhookPayloadDTO,
  RefundRequestDTO,
  RefundResponseDTO,
  PaymentStatusDTO,
} from './payment.dto'
import type { PaymentGateway } from './payment.gateway'

function paise(amount: number) {
  return Math.round(amount * 100)
}

function normalizeVerificationStatus(status: string): 'PAID' | 'FAILED' | 'PENDING' {
  if (status === 'captured') return 'PAID'
  if (status === 'failed') return 'FAILED'
  return 'PENDING'
}

function normalizePaymentStatus(status: string): PaymentStatusDTO['status'] {
  if (status === 'captured') return 'PAID'
  if (status === 'failed') return 'FAILED'
  if (status === 'refunded') return 'REFUNDED'
  if (status === 'cancelled') return 'CANCELLED'
  return 'PENDING'
}

export class RazorpayGateway implements PaymentGateway {
  private readonly client: Razorpay

  constructor() {
    const key_id = process.env.RAZORPAY_KEY_ID ?? env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET ?? env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      throw new Error('Razorpay client configuration is missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.')
    }

    this.client = new Razorpay({ key_id, key_secret })
  }

  async createCheckout(request: CheckoutRequestDTO): Promise<CheckoutResponseDTO> {
    const amount = paise(request.amount)
    const payload: Record<string, unknown> = {
      amount,
      currency: request.currency,
      description: request.description,
      callback_url: request.redirectUrl,
      callback_method: request.redirectUrl ? 'get' : 'get',
      customer: {
        id: request.userId,
      },
      notes: {
        planId: request.planId,
        ...request.metadata,
      },
    }

    const link = await (this.client as any).paymentLink.create(payload)
    const expiresAt = link.expiry_at ? new Date(Number(link.expiry_at) * 1000) : new Date(Date.now() + 1000 * 60 * 15)

    return {
      checkoutId: String(link.id),
      url: String(link.short_url ?? link.long_url ?? `https://checkout.razorpay.com/v1/checkout.js?order_id=${link.order_id}`),
      status: 'CREATED',
      expiresAt,
      metadata: { provider: 'razorpay', raw: link },
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationDTO> {
    const payment = await (this.client as any).payments.fetch(paymentId)
    const status = normalizeVerificationStatus(String(payment.status))

    return {
      checkoutId: String(payment.order_id ?? ''),
      paymentId: String(payment.id),
      provider: 'razorpay',
      status,
      amount: Number(payment.amount ?? 0) / 100,
      currency: String(payment.currency ?? 'INR'),
      metadata: payment,
      verifiedAt: new Date(),
    }
  }

  async verifyWebhook(payload: WebhookPayloadDTO): Promise<PaymentVerificationDTO> {
    const event = payload.event?.toLowerCase() ?? ''
    const data = payload.data ?? {}
    // payment_link.paid and order.paid are successful captures even though
    // the names carry no "captured" substring — normalize them to PAID so
    // verification status agrees with the route's capture classification.
    const status =
      event.includes('captured') || event === 'payment_link.paid' || event === 'order.paid'
        ? 'PAID'
        : event.includes('failed')
          ? 'FAILED'
          : 'PENDING'

    return {
      checkoutId: String(data['order_id'] ?? ''),
      paymentId: String((data as any)['payment_id'] ?? (data as any)['entity']?.['id'] ?? ''),
      provider: 'razorpay',
      status,
      amount: Number((data as any)['amount'] ?? 0) / 100,
      currency: String((data as any)['currency'] ?? 'INR'),
      metadata: data,
      verifiedAt: payload.receivedAt,
    }
  }

  async refund(request: RefundRequestDTO): Promise<RefundResponseDTO> {
    const refund = await (this.client as any).payments.refund(request.paymentId, {
      amount: paise(request.amount),
      speed: 'normal',
      notes: request.metadata,
    })

    return {
      refundId: String(refund.id ?? `refund_${request.paymentId}`),
      provider: 'razorpay',
      status: normalizePaymentStatus(String(refund.status ?? 'pending')) === 'REFUNDED' ? 'COMPLETED' : 'FAILED',
      amount: request.amount,
      currency: request.currency,
      processedAt: new Date(),
      metadata: refund,
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentStatusDTO> {
    try {
      const result = await (this.client as any).subscriptions.cancel(subscriptionId)
      return {
        paymentId: String(result.id ?? subscriptionId),
        status: 'CANCELLED',
        amount: 0,
        currency: 'INR',
        captured: false,
        updatedAt: new Date(),
        metadata: result,
      }
    } catch {
      return {
        paymentId: subscriptionId,
        status: 'FAILED',
        amount: 0,
        currency: 'INR',
        captured: false,
        updatedAt: new Date(),
        metadata: { error: 'subscription cancellation failed' },
      }
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDTO> {
    const payment = await (this.client as any).payments.fetch(paymentId)
    return {
      paymentId: String(payment.id),
      status: normalizePaymentStatus(String(payment.status)),
      amount: Number(payment.amount ?? 0) / 100,
      currency: String(payment.currency ?? 'INR'),
      captured: Boolean(payment.captured),
      updatedAt: new Date(),
      metadata: payment,
    }
  }
}
