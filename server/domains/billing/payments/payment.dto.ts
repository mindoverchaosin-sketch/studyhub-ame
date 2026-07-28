/**
 * Payment gateway DTOs
 */

export interface CheckoutRequestDTO {
  userId?: string
  planId: string
  amount: number
  currency: string
  description?: string
  metadata?: Record<string, unknown>
  redirectUrl?: string
  cancelUrl?: string
}

export interface CheckoutResponseDTO {
  checkoutId: string
  url: string
  status: 'PENDING' | 'CREATED'
  expiresAt: Date
  metadata?: Record<string, unknown>
}

export interface PaymentVerificationDTO {
  checkoutId: string
  paymentId: string
  provider: string
  status: 'PAID' | 'FAILED' | 'PENDING'
  amount: number
  currency: string
  metadata?: Record<string, unknown>
  verifiedAt: Date
}

export interface WebhookPayloadDTO {
  provider: string
  event: string
  data: Record<string, unknown>
  signature?: string
  receivedAt: Date
}

export interface RefundRequestDTO {
  paymentId: string
  amount: number
  currency: string
  reason?: string
  metadata?: Record<string, unknown>
}

export interface RefundResponseDTO {
  refundId: string
  provider: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  amount: number
  currency: string
  processedAt: Date
  metadata?: Record<string, unknown>
}

export interface PaymentStatusDTO {
  paymentId: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  amount: number
  currency: string
  captured: boolean
  updatedAt: Date
  metadata?: Record<string, unknown>
}
