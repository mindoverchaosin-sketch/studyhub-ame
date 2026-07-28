/**
 * Billing Domain DTOs
 * 
 * Data Transfer Objects for billing domain operations
 * (subscriptions, plans, entitlements, invoices, coupons)
 */

// ============================================================
// Feature Types
// ============================================================

export type FeatureName = 
  | 'premiumModules'
  | 'unlimitedMockExams'
  | 'downloadResources'
  | 'analytics'
  | 'aiTools'
  | 'prioritySupport'
  | 'advancedReporting'

// ============================================================
// Plan DTOs
// ============================================================

export interface PlanDTO {
  id: string
  slug: string
  name: string
  interval: 'monthly' | 'quarterly' | 'yearly' | 'lifetime'
  price: number
  currency: string
  isActive: boolean
  features: string[]
  description?: string
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface PlanListDTO {
  plans: PlanDTO[]
  total: number
}

// ============================================================
// Subscription DTOs
// ============================================================

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAUSED'

export interface SubscriptionDTO {
  id: string
  userId: string
  planId: string
  planName: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  renewalAttempts: number
  cancelledAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateSubscriptionInput {
  userId: string
  planId: string
  startDate?: Date
}

export interface SubscriptionListDTO {
  subscriptions: SubscriptionDTO[]
  total: number
}

// ============================================================
// Entitlement DTOs
// ============================================================

export interface EntitlementCheckDTO {
  userId: string
  feature: string
  hasAccess: boolean
  expiresAt?: Date | null
  reason?: string
}

export interface EntitlementListDTO {
  features: string[]
  subscriptionStatus: SubscriptionStatus | null
  planName?: string
  expiresAt?: Date | null
}

// ============================================================
// Invoice DTOs
// ============================================================

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'FAILED' | 'CANCELLED'

export interface InvoiceDTO {
  id: string
  invoiceNumber: string
  subscriptionId: string
  status: InvoiceStatus
  amount: number
  currency: string
  dueDate?: Date | null
  paidAt?: Date | null
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceListDTO {
  invoices: InvoiceDTO[]
  total: number
}

export interface StudentSubscriptionOverviewDTO {
  id: string
  planId: string
  planName: string
  planSlug: string
  status: SubscriptionStatus
  currency: string
  price: number
  renewalAmount: number
  currentPeriodStart: Date
  currentPeriodEnd: Date
  renewalDate: Date | null
}

export interface StudentBillingOverviewDTO {
  currentSubscription: StudentSubscriptionOverviewDTO | null
  entitlements: EntitlementListDTO
  invoices: InvoiceDTO[]
  availablePlans: PlanDTO[]
}

// ============================================================
// Coupon DTOs
// ============================================================

export interface CouponDTO {
  id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  isActive: boolean
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Payment DTOs (Placeholder)
// ============================================================

export interface PaymentGatewayConfig {
  provider: 'razorpay' | 'stripe' | 'none'
  apiKey?: string
  webhookSecret?: string
  // Future: additional provider-specific config
}

export interface PaymentIntentDTO {
  orderId: string
  amount: number
  currency: string
  // Future: provider-specific fields
}
