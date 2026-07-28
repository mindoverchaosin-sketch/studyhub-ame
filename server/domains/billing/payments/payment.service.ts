import { paymentGatewayFactory } from './payment-gateway.factory'
import type { PaymentGateway } from './payment.gateway'
import type {
  CheckoutRequestDTO,
  CheckoutResponseDTO,
  PaymentVerificationDTO,
  WebhookPayloadDTO,
  RefundRequestDTO,
  RefundResponseDTO,
  PaymentStatusDTO,
} from './payment.dto'

export class PaymentService {
  private gateway: PaymentGateway

  constructor(gateway?: PaymentGateway) {
    this.gateway = gateway ?? paymentGatewayFactory.create()
  }

  async createCheckout(request: CheckoutRequestDTO): Promise<CheckoutResponseDTO> {
    return this.gateway.createCheckout(request)
  }

  async verifyPayment(paymentId: string): Promise<PaymentVerificationDTO> {
    return this.gateway.verifyPayment(paymentId)
  }

  async verifyWebhook(payload: WebhookPayloadDTO): Promise<PaymentVerificationDTO> {
    return this.gateway.verifyWebhook(payload)
  }

  async refund(request: RefundRequestDTO): Promise<RefundResponseDTO> {
    return this.gateway.refund(request)
  }

  async cancelSubscription(subscriptionId: string): Promise<PaymentStatusDTO> {
    return this.gateway.cancelSubscription(subscriptionId)
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDTO> {
    return this.gateway.getPaymentStatus(paymentId)
  }
}

export const paymentService = new PaymentService()
