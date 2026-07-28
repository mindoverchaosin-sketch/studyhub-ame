import { subscriptionRepository } from '@/server/domains/billing/subscriptions/subscription.repository'
import { SubscriptionService } from '@/server/domains/billing/subscriptions/subscription.service'
import type { SubscriptionDTO, SubscriptionListDTO } from '@/server/domains/billing/dto/billing.dto'
import { auditLogService } from '@/server/services/audit-log.service'

export interface SubscriptionManagementQueryDTO {
  status?: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'CANCELLED' | 'ALL'
  plan?: string
  search?: string
  sortBy?: 'renewal' | 'expiry' | 'created'
  page?: number
  pageSize?: number
}

export interface SubscriptionManagementActor {
  id: string
  role?: string | null
}

export interface SubscriptionListItemDTO extends SubscriptionDTO {
  studentName: string
  studentEmail: string
  planSlug: string
}

export interface SubscriptionDirectoryDTO extends SubscriptionListDTO {
  subscriptions: SubscriptionListItemDTO[]
}

export class SubscriptionManagementService {
  constructor(private readonly subscriptionService = new SubscriptionService()) {}

  async getSubscriptions(query: SubscriptionManagementQueryDTO = {}): Promise<SubscriptionDirectoryDTO> {
    const where = this.buildWhereClause(query)
    const subscriptions = await subscriptionRepository.findMany(where)

    const mapped = subscriptions
      .map((subscription) => this.mapToListItem(subscription))
      .filter((subscription) => this.matchesSearch(subscription, query.search))
      .filter((subscription) => this.matchesPlan(subscription, query.plan))
      .sort((a, b) => this.sortSubscriptions(a, b, query.sortBy))

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const start = (page - 1) * pageSize
    const paged = mapped.slice(start, start + pageSize)

    return {
      subscriptions: paged,
      total: mapped.length,
    }
  }

  async getSubscription(id: string): Promise<SubscriptionListItemDTO | null> {
    const subscription = await subscriptionRepository.findById(id)
    return subscription ? this.mapToListItem(subscription) : null
  }

  async upgradeSubscription(id: string, planId: string, actor: SubscriptionManagementActor): Promise<SubscriptionDTO> {
    const result = await this.subscriptionService.upgradePlan(id, planId)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'subscription.upgraded',
      entityType: 'Subscription',
      entityId: id,
      metadata: { planId },
    })
    return result
  }

  async downgradeSubscription(id: string, planId: string, actor: SubscriptionManagementActor): Promise<SubscriptionDTO> {
    const result = await this.subscriptionService.downgradePlan(id, planId)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'subscription.downgraded',
      entityType: 'Subscription',
      entityId: id,
      metadata: { planId },
    })
    return result
  }

  async pauseSubscription(id: string, actor: SubscriptionManagementActor): Promise<SubscriptionDTO> {
    const result = await this.subscriptionService.pauseSubscription(id)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'subscription.paused',
      entityType: 'Subscription',
      entityId: id,
    })
    return result
  }

  async resumeSubscription(id: string, actor: SubscriptionManagementActor): Promise<SubscriptionDTO> {
    const result = await this.subscriptionService.resumeSubscription(id)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'subscription.resumed',
      entityType: 'Subscription',
      entityId: id,
    })
    return result
  }

  async cancelSubscription(id: string, actor: SubscriptionManagementActor): Promise<SubscriptionDTO> {
    const result = await this.subscriptionService.cancelSubscription(id)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'subscription.cancelled',
      entityType: 'Subscription',
      entityId: id,
    })
    return result
  }

  async expireSubscription(id: string, actor: SubscriptionManagementActor): Promise<SubscriptionDTO> {
    const result = await this.subscriptionService.expireSubscription(id)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'subscription.expired',
      entityType: 'Subscription',
      entityId: id,
    })
    return result
  }

  async renewSubscription(id: string, actor: SubscriptionManagementActor): Promise<SubscriptionDTO> {
    const result = await this.subscriptionService.renewSubscription(id)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'subscription.renewed',
      entityType: 'Subscription',
      entityId: id,
    })
    return result
  }

  private buildWhereClause(query: SubscriptionManagementQueryDTO) {
    const where: Record<string, unknown> = {}

    if (query.status && query.status !== 'ALL') {
      where.status = query.status
    }

    return where
  }

  private matchesSearch(subscription: SubscriptionListItemDTO, search?: string) {
    const normalized = search?.trim().toLowerCase()
    if (!normalized) {
      return true
    }

    return [subscription.studentName, subscription.studentEmail].some((value) => value.toLowerCase().includes(normalized))
  }

  private matchesPlan(subscription: SubscriptionListItemDTO, plan?: string) {
    if (!plan) {
      return true
    }

    return subscription.planSlug === plan
  }

  private sortSubscriptions(a: SubscriptionListItemDTO, b: SubscriptionListItemDTO, sortBy?: SubscriptionManagementQueryDTO['sortBy']) {
    switch (sortBy) {
      case 'renewal':
        return a.currentPeriodEnd.getTime() - b.currentPeriodEnd.getTime()
      case 'expiry':
        return a.currentPeriodEnd.getTime() - b.currentPeriodEnd.getTime()
      case 'created':
        return a.createdAt.getTime() - b.createdAt.getTime()
      default:
        return a.createdAt.getTime() - b.createdAt.getTime()
    }
  }

  private mapToListItem(subscription: any): SubscriptionListItemDTO {
    return {
      id: subscription.id,
      userId: subscription.userId,
      planId: subscription.subscriptionPlanId,
      planName: subscription.subscriptionPlan.name,
      planSlug: subscription.subscriptionPlan.slug,
      studentName: subscription.user?.displayName ?? subscription.user?.email ?? 'Unknown student',
      studentEmail: subscription.user?.email ?? '',
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewalAttempts: subscription.renewalAttempts,
      cancelledAt: subscription.cancelledAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    }
  }
}

export const subscriptionManagementService = new SubscriptionManagementService()
