import { env } from '@/lib/env'
import { MockPaymentGateway } from './mock-payment.gateway'
import { RazorpayGateway } from './razorpay.gateway'
import type { PaymentGateway } from './payment.gateway'

export type PaymentProvider = 'mock' | 'razorpay' | 'stripe'

export class PaymentGatewayFactory {
  create(provider?: PaymentProvider): PaymentGateway {
    const selectedProvider = provider ?? env.PAYMENT_PROVIDER ?? 'mock'

    switch (selectedProvider) {
      case 'mock':
        return new MockPaymentGateway()
      case 'razorpay':
        return new RazorpayGateway()
      case 'stripe':
        throw new Error('stripe adapter is not implemented yet.')
      default:
        return new MockPaymentGateway()
    }
  }
}

export const paymentGatewayFactory = new PaymentGatewayFactory()
