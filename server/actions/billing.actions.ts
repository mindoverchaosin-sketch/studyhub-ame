'use server'

import { redirect } from 'next/navigation'
import { requireStudent, requirePermission, requireOwnership } from '@/auth'
import { billingDashboardService } from '@/server/services/billing-dashboard.service'
import { billingFacadeService } from '@/server/services/billing-facade.service'
import { planManagementService } from '@/server/services/plan-management.service'
import { subscriptionManagementService } from '@/server/services/subscription-management.service'
import { invoiceManagementService } from '@/server/services/invoice-management.service'
import type { PlanManagementActor, PlanManagementQueryDTO, UpdatePlanInput } from '@/server/services/plan-management.service'
import type { SubscriptionManagementActor, SubscriptionManagementQueryDTO } from '@/server/services/subscription-management.service'
import type { InvoiceManagementActor, InvoiceManagementQueryDTO } from '@/server/services/invoice-management.service'

export async function getBillingDashboard() {
  await requirePermission('viewBillingAnalytics')
  return billingDashboardService.getBillingDashboard()
}

export async function getPlans(query: PlanManagementQueryDTO = {}) {
  await requirePermission('manageBilling')
  return planManagementService.getPlans(query)
}

export async function getPlan(id: string) {
  await requirePermission('manageBilling')
  return planManagementService.getPlan(id)
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: PlanManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return planManagementService.updatePlan(id, input, actor)
}

export async function togglePlanStatus(id: string, isActive: boolean) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: PlanManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return planManagementService.togglePlanStatus(id, isActive, actor)
}

export async function savePlanChanges(id: string, formData: FormData) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: PlanManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }

  const input: UpdatePlanInput = {
    name: formData.get('name')?.toString().trim() || undefined,
    description: formData.get('description')?.toString().trim() || undefined,
    price: Number(formData.get('price')) || undefined,
    displayOrder: Number(formData.get('displayOrder')) || undefined,
    interval: formData.get('interval')?.toString() as UpdatePlanInput['interval'],
    features: formData.get('features')?.toString().split(',').map((feature) => feature.trim()).filter(Boolean),
    isActive: formData.get('isActive') === 'on',
  }

  await planManagementService.updatePlan(id, input, actor)
  redirect(`/admin/billing/plans/${id}`)
}

export async function getSubscriptions(query: SubscriptionManagementQueryDTO = {}) {
  await requirePermission('manageBilling')
  return subscriptionManagementService.getSubscriptions(query)
}

export async function getSubscription(id: string) {
  await requirePermission('manageBilling')
  return subscriptionManagementService.getSubscription(id)
}

export async function upgradeSubscription(id: string, planId: string) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: SubscriptionManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return subscriptionManagementService.upgradeSubscription(id, planId, actor)
}

export async function downgradeSubscription(id: string, planId: string) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: SubscriptionManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return subscriptionManagementService.downgradeSubscription(id, planId, actor)
}

export async function pauseSubscription(id: string) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: SubscriptionManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return subscriptionManagementService.pauseSubscription(id, actor)
}

export async function resumeSubscription(id: string) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: SubscriptionManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return subscriptionManagementService.resumeSubscription(id, actor)
}

export async function cancelSubscription(id: string) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: SubscriptionManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return subscriptionManagementService.cancelSubscription(id, actor)
}

export async function expireSubscription(id: string) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: SubscriptionManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return subscriptionManagementService.expireSubscription(id, actor)
}

export async function renewSubscription(id: string) {
  await requirePermission('manageBilling')
  const session = await requirePermission('manageBilling')
  const actor: SubscriptionManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return subscriptionManagementService.renewSubscription(id, actor)
}

export async function getInvoices(query: InvoiceManagementQueryDTO = {}) {
  await requirePermission('manageInvoices')
  return invoiceManagementService.getInvoices(query)
}

export async function getInvoice(id: string) {
  await requirePermission('manageInvoices')
  return invoiceManagementService.getInvoice(id)
}

export async function getStudentBillingOverviewAction(studentId: string) {
  const session = await requireStudent()
  requireOwnership(studentId, session.user.id)
  return billingFacadeService.getStudentBillingOverview(studentId)
}

export async function markPaid(id: string) {
  await requirePermission('manageInvoices')
  const session = await requirePermission('manageInvoices')
  const actor: InvoiceManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return invoiceManagementService.markPaid(id, actor)
}

export async function cancelInvoice(id: string) {
  await requirePermission('manageInvoices')
  const session = await requirePermission('manageInvoices')
  const actor: InvoiceManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return invoiceManagementService.cancelInvoice(id, actor)
}

export async function voidInvoice(id: string) {
  await requirePermission('manageInvoices')
  const session = await requirePermission('manageInvoices')
  const actor: InvoiceManagementActor = {
    id: (session.user as { id?: string }).id ?? 'system',
    role: session.user.role,
  }
  return invoiceManagementService.voidInvoice(id, actor)
}
