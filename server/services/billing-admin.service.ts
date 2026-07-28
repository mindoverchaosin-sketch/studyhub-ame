import { BillingDashboardService } from '@/server/services/billing-dashboard.service'

export class BillingAdminService extends BillingDashboardService {}

export const billingAdminService = new BillingAdminService()
