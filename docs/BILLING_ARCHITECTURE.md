# Billing Domain Architecture

## Overview

The Billing domain now supports administrative subscription management alongside dashboard visibility and plan maintenance. Phase 1B.3 introduces subscription administration workflows for billing operators without implementing payment processing, coupons, invoices, or student-facing billing flows.

**Important**: This Phase 1B.1 implementation does NOT include payment processing. Payment gateway integration (Razorpay, Stripe) is planned for a future phase.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Admin UI)                        │
│  - Billing Overview page                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Server Action (API Layer)                    │
│  - getBillingDashboard()                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Services Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ BillingDashboardService                                 │   │
│  │  - getBillingDashboard()                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Repositories Layer                            │
│  - SubscriptionRepository       (Subscription model)            │
│  - PlanRepository               (SubscriptionPlan model)         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Prisma ORM                                 │
│  - Subscription model                                           │
│  - SubscriptionPlan model                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Domain Models

### Subscription

Tracks a user's active subscription to a plan.

```typescript
model Subscription {
  id                 String        @id @default(uuid())
  userId             String
  subscriptionPlanId String
  status             SubscriptionStatus
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  renewalAttempts    Int
  cancelledAt        DateTime?
  
  // Relations
  user              User
  subscriptionPlan  SubscriptionPlan
  invoices          Invoice[]
}

enum SubscriptionStatus {
  ACTIVE    // Currently active subscription
  EXPIRED   // Period ended, not renewed
  CANCELLED // User cancelled
  PAUSED    // Temporarily paused
}
```

**Key Concepts**:
- A user can have ONE active subscription at a time
- Subscriptions have a billing period (currentPeriodStart → currentPeriodEnd)
- Status transitions: ACTIVE → EXPIRED, ACTIVE → CANCELLED, ACTIVE → PAUSED
- Renewal is manual in Phase 1A (automatic renewal in Phase 2)

### Invoice

Tracks billing invoices for subscriptions.

```typescript
model Invoice {
  id             String
  subscriptionId String
  invoiceNumber  String @unique
  status         InvoiceStatus
  dueDate        DateTime?
  paidAt         DateTime?
  amount         Decimal
  currency       String
  description    String?
  
  subscription   Subscription
}

enum InvoiceStatus {
  DRAFT      // Not yet sent to customer
  SENT       // Sent to customer
  PAID       // Payment received
  FAILED     // Payment failed
  CANCELLED  // Invoice cancelled
}
```

### Plan

Defines subscription tiers with features.

```typescript
interface PlanDefinition {
  id           string              // e.g., "plan_monthly"
  slug         string              // e.g., "monthly"
  name         string              // e.g., "Monthly"
  interval     'monthly' | 'quarterly' | 'yearly' | 'lifetime'
  price        number              // in INR
  currency     string              // "INR"
  description  string
  features     FeatureName[]        // List of enabled features
  isActive     boolean
  displayOrder number               // For UI ordering
}
```

**Available Plans** (from plan.config.ts):

| Plan | Price | Interval | Features |
|------|-------|----------|----------|
| Free | ₹0 | — | None |
| Monthly | ₹499 | monthly | premiumModules, unlimitedMockExams, downloadResources, prioritySupport |
| Quarterly | ₹1,299 | quarterly | + analytics |
| Yearly | ₹4,999 | yearly | + aiTools, advancedReporting |
| Lifetime | ₹9,999 | lifetime | All features forever |

### Coupon

Discount codes for subscriptions.

```typescript
model Coupon {
  id            String
  code          String @unique
  discountType  'percentage' | 'fixed'
  discountValue Decimal
  isActive      Boolean
  expiresAt     DateTime?
  
  discounts     Discount[]
}
```

## Billing Dashboard Metrics

The dashboard endpoint returns a read-only summary for administrators.

### Metrics

- Total subscriptions
- Active subscriptions
- Cancelled subscriptions
- Expired subscriptions
- Estimated Monthly Recurring Revenue (MRR)
- Estimated Annual Recurring Revenue (ARR)
- Lifetime subscriptions
- Plan distribution by subscription tier

### Data Flow

```typescript
const dashboard = await billingDashboardService.getBillingDashboard()
```

The service uses repositories for both subscriptions and plans and returns a DTO-shaped response for the UI.

### Access Control

The dashboard action requires the `viewBillingAnalytics` permission.
Subscription administration requires the `manageBilling` permission.

### Subscription Administration Workflow

Administrators can review the subscription directory, inspect a subscription detail page, and trigger lifecycle actions through the service layer:

```typescript
const subscriptions = await subscriptionManagementService.getSubscriptions({ status: 'ACTIVE', page: 1, pageSize: 20 })
await subscriptionManagementService.upgradeSubscription(subscriptionId, planId, actor)
await subscriptionManagementService.pauseSubscription(subscriptionId, actor)
```

Administrative lifecycle actions are routed through `SubscriptionManagementService`, which records audit events for plan changes and lifecycle transitions. The service uses `SubscriptionService` for the actual state transition and `EntitlementService` remains the source of truth for feature access checks.

#### Lifecycle actions
- Upgrade plan
- Downgrade plan
- Pause subscription
- Resume subscription
- Cancel subscription
- Expire subscription
- Manual renewal

These operations are intentionally limited to admin control and do not include payment processing, invoice generation, or student portal access.

#### Cancel
```typescript
const cancelled = await subscriptionService.cancelSubscription(subscriptionId)
// Returns: SubscriptionDTO (CANCELLED status)
```

User-initiated cancellation. Cannot be reversed; user must create new subscription.

#### Pause / Resume
```typescript
const paused = await subscriptionService.pauseSubscription(subscriptionId)
const resumed = await subscriptionService.resumeSubscription(subscriptionId)
// Returns: SubscriptionDTO
```

Pauses features but keeps subscription data. Useful for:
- Temporary hold (e.g., financial constraints)
- Maintenance windows (Phase 2)

## Entitlement System

### Feature Access Model

Features are defined in the plan configuration and checked at runtime:

```typescript
// Check a single feature
const canAccess = await entitlementService.hasFeatureAccess(userId, 'premiumModules')
// Returns: EntitlementCheckDTO { hasAccess, expiresAt, reason }

// Check common features
const isPremium = await entitlementService.canAccessPremiumModules(userId)
const canDownload = await entitlementService.canDownloadResources(userId)
const canAnalyze = await entitlementService.canAccessAnalytics(userId)
const canUseAI = await entitlementService.canUseFutureAITools(userId)

// Get all entitlements
const entitlements = await entitlementService.getUserEntitlements(userId)
// Returns: EntitlementListDTO { features[], subscriptionStatus, planName, expiresAt }
```

### Feature Definitions

| Feature | Description | Tier |
|---------|-------------|------|
| `premiumModules` | Access to premium/advanced modules | Monthly+ |
| `unlimitedMockExams` | Unlimited mock exam attempts | Monthly+ |
| `downloadResources` | Download study materials (PDF, video) | Monthly+ |
| `analytics` | View personal learning analytics dashboard | Quarterly+ |
| `aiTools` | AI-powered study suggestions (future) | Yearly+ |
| `prioritySupport` | Priority customer support queue | Monthly+ |
| `advancedReporting` | Advanced admin reporting features | Yearly+ |

### Access Check Flow

```typescript
// Internal flow for hasFeatureAccess():

1. Load user's active subscription
   └─ If none: deny access, reason = "No active subscription"

2. Check subscription status
   └─ If CANCELLED/PAUSED/EXPIRED: deny access

3. Check period expiration
   └─ If currentDate > currentPeriodEnd: deny access, status = "EXPIRED"

4. Load plan configuration by slug
   └─ If not found: deny access, reason = "Plan not found"

5. Check if feature in plan.features[]
   └─ If yes: grant access, set expiresAt to periodEnd
   └─ If no: deny access
```

### Integration Example

```typescript
// In a server action or service

export async function getStudentDashboard(userId: string) {
  const canAnalyze = await entitlementService.canAccessAnalytics(userId)
  
  if (canAnalyze) {
    const analytics = await analyticsService.getStudentAnalytics(userId)
    return { dashboard: true, analytics }
  } else {
    return { 
      dashboard: true, 
      analytics: null,
      message: "Upgrade to Quarterly or higher for analytics"
    }
  }
}
```

## Plan Configuration Management

All plans are defined in `server/domains/billing/plans/plan.config.ts`.

### Why Not Hardcode Feature Checks?

**Anti-pattern** ❌:
```typescript
// DON'T DO THIS
if (user.subscriptionTier === 'yearly') {
  // enable AI tools
}
```

**Correct pattern** ✅:
```typescript
// DO THIS
if (await entitlementService.canUseFutureAITools(userId)) {
  // enable AI tools
}
```

**Benefits**:
- Single source of truth for plan definitions
- Easy to add/modify plans without code changes
- Consistent feature checks across codebase
- Testable and auditable

### Adding a New Plan

1. Update `plan.config.ts`:
```typescript
export const PLANS = {
  // ... existing plans
  PREMIUM_PLUS: {
    id: 'plan_premium_plus',
    slug: 'premium-plus',
    name: 'Premium Plus',
    interval: 'monthly',
    price: 799,
    features: ['premiumModules', 'unlimitedMockExams', /* ... */],
    isActive: true,
    displayOrder: 2.5,
  },
}
```

2. Features available immediately via:
```typescript
const canAccess = await entitlementService.canUseFutureAITools(userId)
```

## Authorization & RBAC

### Billing Permissions

Current roles and billing permissions:

| Role | manageBilling | viewBillingAnalytics | viewInvoices |
|------|---------------|----------------------|--------------|
| SUPER_ADMIN | ✓ | ✓ | ✓ |
| ADMIN | ✓ | ✓ | ✓ |
| FINANCE_MANAGER | ✓ | ✓ | ✓ |
| STUDENT_MANAGER | ✗ | ✗ | ✗ |
| CONTENT_MANAGER | ✗ | ✗ | ✗ |
| STUDENT | ✗ | ✗ | ✗ |

**Entitlements** are NOT RBAC-based. They're subscription-based:
- A STUDENT with an active subscription can access premium modules
- A STUDENT without a subscription cannot, even if admin

## Payment Gateway Integration Strategy

### Phase 1A (Current)
- ✅ Subscription model & lifecycle
- ✅ Entitlement checking
- ✅ Invoice tracking (metadata only)
- ✅ Plan configuration
- ❌ Payment processing (placeholder)

### Phase 2 (Future)
- 🔄 Payment gateway integration (Razorpay/Stripe)
- 🔄 Payment webhook handling
- 🔄 Automatic subscription renewal
- 🔄 Pro-rated billing
- 🔄 Refund handling

### Payment Abstraction (New)
This release introduces a provider-agnostic payment abstraction layer that separates payment integration from subscription lifecycle logic. It does not yet connect to an external payment provider, create checkout pages, or call any external APIs.

The new payment layer includes:
- `PaymentGateway` interface
- `MockPaymentGateway` adapter
- `PaymentGatewayFactory` for choosing providers
- `PaymentService` facade for gateway operations
- typed payment DTOs for checkout, verification, webhook payloads, refunds, and status checks

The architecture remains:

```
UI
↓
Server Actions
↓
BillingFacade
↓
SubscriptionService
↓
PaymentGateway Interface
↓
Payment Provider Adapter
↓
External Provider
```

### Phase 3 (Future)
- 🔄 Usage-based billing
- 🔄 Invoice management UI
- 🔄 Billing analytics dashboard
- 🔄 Tax calculation

## Testing Strategy

### Unit Tests
- ✅ `tests/billing/subscription.service.test.ts` - Lifecycle operations
- ✅ `tests/billing/entitlement.service.test.ts` - Feature access checks
- ✅ `tests/billing/plan-config.test.ts` - Plan definitions
- ✅ `tests/billing/billing-authorization.test.ts` - RBAC permissions

### Repository Tests (TODO)
- `tests/billing/subscription.repository.test.ts`
- `tests/billing/invoice.repository.test.ts`
- `tests/billing/plan.repository.test.ts`

### Integration Tests (TODO)
- Subscription → Entitlement flow
- Plan upgrade → Feature availability
- Invoice generation on renewal

## File Structure

```
server/domains/billing/
├── dto/
│   └── billing.dto.ts              # All billing DTOs
├── plans/
│   ├── plan.config.ts              # Plan definitions (source of truth)
│   └── plan.repository.ts           # SubscriptionPlan data access
├── subscriptions/
│   ├── subscription.repository.ts   # Subscription data access
│   └── subscription.service.ts      # Subscription lifecycle
├── entitlements/
│   └── entitlement.service.ts       # Feature access checking
├── invoices/
│   └── invoice.repository.ts        # Invoice data access
├── coupons/
│   └── coupon.repository.ts         # Coupon data access
├── payments/
│   ├── payment.dto.ts               # Payment DTO definitions
│   ├── payment.gateway.ts           # Payment gateway interface
│   ├── mock-payment.gateway.ts      # Mock provider implementation
│   ├── payment-gateway.factory.ts   # Provider factory
│   └── payment.service.ts           # Payment facade / service
└── README.md                         # This file
```

## Database Schema

### Subscription Table

```sql
CREATE TABLE "Subscription" (
  id                 UUID PRIMARY KEY,
  userId             UUID NOT NULL UNIQUE,
  subscriptionPlanId UUID NOT NULL,
  status             TEXT NOT NULL DEFAULT 'ACTIVE',
  currentPeriodStart TIMESTAMP NOT NULL,
  currentPeriodEnd   TIMESTAMP NOT NULL,
  renewalAttempts    INT NOT NULL DEFAULT 0,
  cancelledAt        TIMESTAMP,
  createdAt          TIMESTAMP DEFAULT NOW(),
  updatedAt          TIMESTAMP DEFAULT NOW(),
  deletedAt          TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE,
  FOREIGN KEY (subscriptionPlanId) REFERENCES "SubscriptionPlan"(id)
);

CREATE INDEX idx_subscription_userId ON "Subscription"(userId);
CREATE INDEX idx_subscription_status ON "Subscription"(status);
```

### Invoice Table

```sql
CREATE TABLE "Invoice" (
  id             UUID PRIMARY KEY,
  subscriptionId UUID NOT NULL,
  invoiceNumber  VARCHAR UNIQUE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'DRAFT',
  dueDate        TIMESTAMP,
  paidAt         TIMESTAMP,
  amount         DECIMAL(10, 2) NOT NULL,
  currency       VARCHAR DEFAULT 'INR',
  description    TEXT,
  metadata       JSONB,
  createdAt      TIMESTAMP DEFAULT NOW(),
  updatedAt      TIMESTAMP DEFAULT NOW(),
  deletedAt      TIMESTAMP,
  
  FOREIGN KEY (subscriptionId) REFERENCES "Subscription"(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoice_subscriptionId ON "Invoice"(subscriptionId);
CREATE INDEX idx_invoice_status ON "Invoice"(status);
```

## Future Enhancements

1. **Automatic Renewal**: Cron job to auto-renew active subscriptions on period end
2. **Pro-rated Billing**: Partial refunds/charges for mid-cycle plan changes
3. **Usage-Based Billing**: Charge based on resource usage (mock exams, downloads)
4. **Payment Webhooks**: Handle Razorpay/Stripe callbacks
5. **Subscription Analytics**: Track churn, LTV, MRR
6. **Flexible Billing**: Support yearly prepay, quarterly flexibility, etc.
7. **Trial Periods**: Free trial before first payment
8. **Family Plans**: Multiple users on one subscription
9. **Gift Cards/Vouchers**: Pre-paid access codes
10. **Dunning Management**: Retry failed payments, notify about expiry

## Troubleshooting

### User claims they have access but doesn't

Check:
1. Is there an active Subscription for the user?
   ```sql
   SELECT * FROM "Subscription" WHERE userId = 'xxx' AND status = 'ACTIVE'
   ```
2. Is the currentPeriodEnd in the future?
3. Is the plan in the plan.config.ts? (Or was it deactivated?)
4. Does the plan have the requested feature?

### Subscription not expiring

The expiration is manual in Phase 1A. To test:
```typescript
const sub = await subscriptionService.getSubscription(subId)
if (new Date() > sub.currentPeriodEnd) {
  await subscriptionService.expireSubscription(subId)
}
```

In Phase 2, a cron job will handle this automatically.

## References

- **Prisma Schema**: [prisma/schema.prisma](../../prisma/schema.prisma)
- **Permission Service**: [server/services/permission.service.ts](../../server/services/permission.service.ts)
- **Entitlement Tests**: [tests/billing/entitlement.service.test.ts](../../tests/billing/entitlement.service.test.ts)
- **Plan Tests**: [tests/billing/plan-config.test.ts](../../tests/billing/plan-config.test.ts)
