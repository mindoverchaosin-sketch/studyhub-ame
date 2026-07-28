import { PaymentGateway } from './payment.gateway'
import type {
  CheckoutRequestDTO,
  CheckoutResponseDTO,
  PaymentVerificationDTO,
  WebhookPayloadDTO,
  RefundRequestDTO,
  RefundResponseDTO,
  PaymentStatusDTO,
} from './payment.dto'

function createMockId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
}

export class MockPaymentGateway implements PaymentGateway {
  async createCheckout(request: CheckoutRequestDTO): Promise<CheckoutResponseDTO> {
    return {
      checkoutId: createMockId('mock_checkout'),
      url: `https://mock-payments.local/checkout/${encodeURIComponent(request.planId)}`,
      status: 'CREATED',
      expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      metadata: {
        planId: request.planId,
        amount: request.amount,
      },
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationDTO> {
    return {
      checkoutId: `mock_checkout_${paymentId}`,
      paymentId,
      provider: 'mock',
      status: paymentId.includes('fail') ? 'FAILED' : 'PAID',
      amount: 0,
      currency: 'INR',
      metadata: { test: true },
      verifiedAt: new Date(),
    }
  }

  async verifyWebhook(payload: WebhookPayloadDTO): Promise<PaymentVerificationDTO> {
    const status = payload.event === 'payment.captured' ? 'PAID' : payload.event === 'payment.failed' ? 'FAILED' : 'PENDING'
    return {
      checkoutId: String(payload.data['checkoutId'] ?? createMockId('mock_checkout')),
      paymentId: String(payload.data['paymentId'] ?? createMockId('mock_payment')),
      provider: payload.provider,
      status,
      amount: Number(payload.data['amount'] ?? 0),
      currency: String(payload.data['currency'] ?? 'INR'),
      metadata: payload.data,
      verifiedAt: new Date(payload.receivedAt),
    }
  }

  async refund(request: RefundRequestDTO): Promise<RefundResponseDTO> {
    return {
      refundId: createMockId('mock_refund'),
      provider: 'mock',
      status: request.paymentId.includes('fail') ? 'FAILED' : 'COMPLETED',
      amount: request.amount,
      currency: request.currency,
      processedAt: new Date(),
      metadata: request.metadata,
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentStatusDTO> {
    return {
      paymentId: `subscription_${subscriptionId}`,
      status: 'CANCELLED',
      amount: 0,
      currency: 'INR',
      captured: false,
      updatedAt: new Date(),
      metadata: { subscriptionId },
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDTO> {
    return {
      paymentId,
      status: paymentId.includes('refunded') ? 'REFUNDED' : paymentId.includes('fail') ? 'FAILED' : 'PAID',
      amount: 0,
      currency: 'INR',
      captured: true,
      updatedAt: new Date(),
      metadata: { provider: 'mock' },
    }
  }
}
