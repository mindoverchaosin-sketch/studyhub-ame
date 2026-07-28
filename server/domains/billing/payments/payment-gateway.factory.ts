import { MockPaymentGateway } from './mock-payment.gateway'
import type { PaymentGateway } from './payment.gateway'

export type PaymentProvider = 'mock' | 'razorpay' | 'stripe'

export class PaymentGatewayFactory {
  create(provider: PaymentProvider = 'mock'): PaymentGateway {
    switch (provider) {
      case 'mock':
        return new MockPaymentGateway()
      case 'razorpay':
      case 'stripe':
        throw new Error(`${provider} adapter is not implemented yet.`)
      default:
        return new MockPaymentGateway()
    }
  }
}

export const paymentGatewayFactory = new PaymentGatewayFactory()
