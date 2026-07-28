import { entitlementService } from '@/server/domains/billing/entitlements/entitlement.service'
import { planManagementService } from '@/server/services/plan-management.service'
import { invoiceRepository } from '@/server/domains/billing/invoices/invoice.repository'
import { subscriptionRepository } from '@/server/domains/billing/subscriptions/subscription.repository'
import type { InvoiceDTO, PlanDTO, StudentBillingOverviewDTO, StudentSubscriptionOverviewDTO } from '@/server/domains/billing/dto/billing.dto'

function getSubscriptionPrice(subscription: any): number {
  const plan = subscription.subscriptionPlan
  const directPrice = plan?.price

  if (typeof directPrice === 'number') {
    return directPrice
  }

  if (typeof directPrice === 'string') {
    const parsed = Number(directPrice)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const productPrice = plan?.productPrice?.amount
  if (typeof productPrice === 'number') {
    return productPrice
  }

  if (typeof productPrice === 'string') {
    const parsed = Number(productPrice)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export class BillingFacadeService {
  async getStudentBillingOverview(userId: string): Promise<StudentBillingOverviewDTO> {
    const [subscription, entitlements, availablePlans] = await Promise.all([
      subscriptionRepository.findByUserId(userId),
      entitlementService.getUserEntitlements(userId),
      planManagementService.getPlans({ status: 'ACTIVE' }),
    ])

    const invoices = subscription ? await invoiceRepository.findBySubscriptionId(subscription.id) : []

    return {
      currentSubscription: subscription ? this.mapSubscription(subscription) : null,
      entitlements,
      invoices: invoices.map(this.mapInvoice),
      availablePlans: availablePlans.plans,
    }
  }

  private mapSubscription(subscription: any): StudentSubscriptionOverviewDTO {
    const plan = subscription.subscriptionPlan
    const price = getSubscriptionPrice(subscription)
    const currency = plan?.productPrice?.currency ?? 'INR'

    return {
      id: subscription.id,
      planId: subscription.subscriptionPlanId,
      planName: plan?.name ?? 'Unknown plan',
      planSlug: plan?.slug ?? 'unknown',
      status: subscription.status,
      currency,
      price,
      renewalAmount: price,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewalDate: subscription.status === 'ACTIVE' ? subscription.currentPeriodEnd : null,
    }
  }

  private mapInvoice(invoice: any): InvoiceDTO {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      status: invoice.status,
      amount: Number(invoice.amount ?? 0),
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      description: invoice.description,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }
  }
}

export const billingFacadeService = new BillingFacadeService()
