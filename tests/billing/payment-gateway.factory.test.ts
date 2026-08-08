import { describe, expect, it } from 'vitest'
import { paymentGatewayFactory } from '@/server/domains/billing/payments/payment-gateway.factory'

describe('PaymentGatewayFactory', () => {
  it('returns a MockPaymentGateway for default provider', () => {
    const gateway = paymentGatewayFactory.create()
    expect(gateway).toHaveProperty('createCheckout')
    expect(gateway).toHaveProperty('verifyPayment')
  })

  it('returns a RazorpayGateway when configured for razorpay', () => {
    process.env.RAZORPAY_KEY_ID = 'test_id'
    process.env.RAZORPAY_KEY_SECRET = 'test_secret'
    const gateway = paymentGatewayFactory.create('razorpay')
    expect(gateway).toHaveProperty('createCheckout')
    expect(gateway).toHaveProperty('verifyPayment')
  })

  it('throws an error for an unimplemented provider', () => {
    expect(() => paymentGatewayFactory.create('stripe')).toThrow('stripe adapter is not implemented yet.')
  })
})
