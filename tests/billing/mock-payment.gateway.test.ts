import { describe, expect, it } from 'vitest'
import { MockPaymentGateway } from '@/server/domains/billing/payments/mock-payment.gateway'

describe('MockPaymentGateway', () => {
  const gateway = new MockPaymentGateway()

  it('creates a checkout response with placeholder data', async () => {
    const result = await gateway.createCheckout({
      planId: 'monthly',
      amount: 499,
      currency: 'INR',
      description: 'Test checkout',
    })

    expect(result.checkoutId).toContain('mock_checkout_')
    expect(result.url).toContain('/checkout/monthly')
    expect(result.status).toBe('CREATED')
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it('verifies payment status as PAID unless paymentId contains fail', async () => {
    const success = await gateway.verifyPayment('payment_123')
    expect(success.status).toBe('PAID')

    const failure = await gateway.verifyPayment('payment_fail_123')
    expect(failure.status).toBe('FAILED')
  })

  it('returns a completed refund response when paymentId is valid', async () => {
    const result = await gateway.refund({
      paymentId: 'payment_123',
      amount: 499,
      currency: 'INR',
    })

    expect(result.status).toBe('COMPLETED')
    expect(result.refundId).toContain('mock_refund_')
  })

  it('cancels a subscription and returns cancelled status', async () => {
    const status = await gateway.cancelSubscription('sub_1')
    expect(status.status).toBe('CANCELLED')
    expect(status.paymentId).toContain('subscription_sub_1')
  })

  it('returns payment status based on paymentId', async () => {
    const paid = await gateway.getPaymentStatus('payment_123')
    expect(paid.status).toBe('PAID')

    const failed = await gateway.getPaymentStatus('payment_fail_123')
    expect(failed.status).toBe('FAILED')

    const refunded = await gateway.getPaymentStatus('payment_refunded_123')
    expect(refunded.status).toBe('REFUNDED')
  })
})
