import type {
  CheckoutRequestDTO,
  CheckoutResponseDTO,
  PaymentVerificationDTO,
  WebhookPayloadDTO,
  RefundRequestDTO,
  RefundResponseDTO,
  PaymentStatusDTO,
} from './payment.dto'

export interface PaymentGateway {
  createCheckout(request: CheckoutRequestDTO): Promise<CheckoutResponseDTO>
  verifyPayment(paymentId: string): Promise<PaymentVerificationDTO>
  verifyWebhook(payload: WebhookPayloadDTO): Promise<PaymentVerificationDTO>
  refund(request: RefundRequestDTO): Promise<RefundResponseDTO>
  cancelSubscription(subscriptionId: string): Promise<PaymentStatusDTO>
  getPaymentStatus(paymentId: string): Promise<PaymentStatusDTO>
}
