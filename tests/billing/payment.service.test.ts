import { describe, expect, it, vi } from 'vitest'
import { PaymentService } from '@/server/domains/billing/payments/payment.service'

describe('PaymentService', () => {
  it('delegates to the configured gateway', async () => {
    const gatewayMock = {
      createCheckout: vi.fn().mockResolvedValue({ checkoutId: 'x', url: 'u', status: 'CREATED', expiresAt: new Date() }),
      verifyPayment: vi.fn().mockResolvedValue({ checkoutId: 'x', paymentId: 'p', provider: 'mock', status: 'PAID', amount: 0, currency: 'INR', verifiedAt: new Date() }),
      verifyWebhook: vi.fn().mockResolvedValue({ checkoutId: 'x', paymentId: 'p', provider: 'mock', status: 'PAID', amount: 0, currency: 'INR', verifiedAt: new Date() }),
      refund: vi.fn().mockResolvedValue({ refundId: 'r', provider: 'mock', status: 'COMPLETED', amount: 0, currency: 'INR', processedAt: new Date() }),
      cancelSubscription: vi.fn().mockResolvedValue({ paymentId: 'subscription_sub', status: 'CANCELLED', amount: 0, currency: 'INR', captured: false, updatedAt: new Date() }),
      getPaymentStatus: vi.fn().mockResolvedValue({ paymentId: 'p', status: 'PAID', amount: 0, currency: 'INR', captured: true, updatedAt: new Date() }),
    }

    const service = new PaymentService(gatewayMock)

    const checkout = await service.createCheckout({ planId: 'monthly', amount: 499, currency: 'INR' })
    expect(checkout.status).toBe('CREATED')
    expect(gatewayMock.createCheckout).toHaveBeenCalled()

    const status = await service.getPaymentStatus('p')
    expect(status.status).toBe('PAID')
    expect(gatewayMock.getPaymentStatus).toHaveBeenCalledWith('p')
  })
})
