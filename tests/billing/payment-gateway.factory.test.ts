import { describe, expect, it } from 'vitest'
import { paymentGatewayFactory } from '@/server/domains/billing/payments/payment-gateway.factory'

describe('PaymentGatewayFactory', () => {
  it('returns a MockPaymentGateway for default provider', () => {
    const gateway = paymentGatewayFactory.create()
    expect(gateway).toHaveProperty('createCheckout')
    expect(gateway).toHaveProperty('verifyPayment')
  })

  it('throws an error for an unimplemented provider', () => {
    expect(() => paymentGatewayFactory.create('razorpay')).toThrow('razorpay adapter is not implemented yet.')
    expect(() => paymentGatewayFactory.create('stripe')).toThrow('stripe adapter is not implemented yet.')
  })
})
