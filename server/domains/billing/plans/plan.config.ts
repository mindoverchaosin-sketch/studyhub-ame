/**
 * Plan Configuration
 * 
 * Defines all subscription plans available in the system.
 * This is the single source of truth for plan definitions.
 * 
 * Usage: Import this configuration in services instead of hardcoding feature checks.
 */

export type PlanInterval = 'monthly' | 'quarterly' | 'yearly' | 'lifetime'
export type FeatureName = 
  | 'premiumModules'
  | 'unlimitedMockExams'
  | 'downloadResources'
  | 'analytics'
  | 'aiTools'
  | 'prioritySupport'
  | 'advancedReporting'

interface PlanDefinition {
  id: string
  slug: string
  name: string
  interval: PlanInterval
  price: number
  currency: string
  description: string
  features: FeatureName[]
  isActive: boolean
  displayOrder: number
}

/**
 * Plan Definitions
 * 
 * Add new plans here. Update feature list to grant access to features.
 * Plans can have overlapping features - the system checks membership.
 */
export const PLANS: Record<string, PlanDefinition> = {
  // Free tier - no payment required
  FREE: {
    id: 'plan_free',
    slug: 'free',
    name: 'Free',
    interval: 'monthly', // Not really an interval, but kept for consistency
    price: 0,
    currency: 'INR',
    description: 'Free access to basic learning modules',
    features: [],
    isActive: true,
    displayOrder: 1,
  },

  // Monthly subscription
  MONTHLY: {
    id: 'plan_monthly',
    slug: 'monthly',
    name: 'Monthly',
    interval: 'monthly',
    price: 499,
    currency: 'INR',
    description: 'Full access for one month',
    features: [
      'premiumModules',
      'unlimitedMockExams',
      'downloadResources',
      'prioritySupport',
    ],
    isActive: true,
    displayOrder: 2,
  },

  // Quarterly subscription
  QUARTERLY: {
    id: 'plan_quarterly',
    slug: 'quarterly',
    name: 'Quarterly',
    interval: 'quarterly',
    price: 1299,
    currency: 'INR',
    description: 'Full access for three months at a discount',
    features: [
      'premiumModules',
      'unlimitedMockExams',
      'downloadResources',
      'analytics',
      'prioritySupport',
    ],
    isActive: true,
    displayOrder: 3,
  },

  // Yearly subscription
  YEARLY: {
    id: 'plan_yearly',
    slug: 'yearly',
    name: 'Yearly',
    interval: 'yearly',
    price: 4999,
    currency: 'INR',
    description: 'Full access for one year at the best price',
    features: [
      'premiumModules',
      'unlimitedMockExams',
      'downloadResources',
      'analytics',
      'aiTools',
      'prioritySupport',
      'advancedReporting',
    ],
    isActive: true,
    displayOrder: 4,
  },

  // Lifetime access
  LIFETIME: {
    id: 'plan_lifetime',
    slug: 'lifetime',
    name: 'Lifetime',
    interval: 'lifetime',
    price: 9999,
    currency: 'INR',
    description: 'One-time payment for lifetime access to all features',
    features: [
      'premiumModules',
      'unlimitedMockExams',
      'downloadResources',
      'analytics',
      'aiTools',
      'prioritySupport',
      'advancedReporting',
    ],
    isActive: true,
    displayOrder: 5,
  },
}

/**
 * Get a plan by slug
 */
export function getPlanBySlug(slug: string): PlanDefinition | undefined {
  return Object.values(PLANS).find((plan) => plan.slug === slug)
}

/**
 * Get a plan by ID
 */
export function getPlanById(id: string): PlanDefinition | undefined {
  return Object.values(PLANS).find((plan) => plan.id === id)
}

/**
 * Get all active plans
 */
export function getActivePlans(): PlanDefinition[] {
  return Object.values(PLANS)
    .filter((plan) => plan.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * Check if a plan has a feature
 */
export function planHasFeature(planSlug: string, feature: FeatureName): boolean {
  const plan = getPlanBySlug(planSlug)
  return plan ? plan.features.includes(feature) : false
}

/**
 * Get feature display name (for UI)
 */
export function getFeatureDisplayName(feature: FeatureName): string {
  const names: Record<FeatureName, string> = {
    premiumModules: 'Premium Modules',
    unlimitedMockExams: 'Unlimited Mock Exams',
    downloadResources: 'Download Resources',
    analytics: 'Learning Analytics',
    aiTools: 'AI Tools',
    prioritySupport: 'Priority Support',
    advancedReporting: 'Advanced Reporting',
  }
  return names[feature] || feature
}
