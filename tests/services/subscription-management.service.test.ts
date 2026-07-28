import { beforeEach, describe, expect, it, vi } from 'vitest'

const subscriptionRepositoryMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
}))

const planRepositoryMock = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
}))

const auditLogServiceMock = vi.hoisted(() => ({
  recordEvent: vi.fn(),
  listAuditLogs: vi.fn(),
}))

const subscriptionServiceMock = vi.hoisted(() => ({
  upgradePlan: vi.fn(),
  downgradePlan: vi.fn(),
  pauseSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  expireSubscription: vi.fn(),
  renewSubscription: vi.fn(),
  getSubscription: vi.fn(),
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: subscriptionRepositoryMock,
}))

vi.mock('@/server/domains/billing/plans/plan.repository', () => ({
  planRepository: planRepositoryMock,
}))

vi.mock('@/server/services/audit-log.service', () => ({
  auditLogService: auditLogServiceMock,
}))

vi.mock('@/server/domains/billing/subscriptions/subscription.service', () => ({
  SubscriptionService: class {
    upgradePlan = subscriptionServiceMock.upgradePlan
    downgradePlan = subscriptionServiceMock.downgradePlan
    pauseSubscription = subscriptionServiceMock.pauseSubscription
    resumeSubscription = subscriptionServiceMock.resumeSubscription
    cancelSubscription = subscriptionServiceMock.cancelSubscription
    expireSubscription = subscriptionServiceMock.expireSubscription
    renewSubscription = subscriptionServiceMock.renewSubscription
    getSubscription = subscriptionServiceMock.getSubscription
  },
}))

import { SubscriptionManagementService } from '@/server/services/subscription-management.service'

describe('SubscriptionManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a filtered and paginated subscription directory', async () => {
    subscriptionRepositoryMock.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        subscriptionPlanId: 'plan-1',
        status: 'ACTIVE',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        renewalAttempts: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: { id: 'user-1', displayName: 'Asha', email: 'asha@example.com' },
        subscriptionPlan: { id: 'plan-1', name: 'Yearly', slug: 'yearly' },
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        subscriptionPlanId: 'plan-2',
        status: 'PAUSED',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        renewalAttempts: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        user: { id: 'user-2', displayName: 'Ravi', email: 'ravi@example.com' },
        subscriptionPlan: { id: 'plan-2', name: 'Monthly', slug: 'monthly' },
      },
    ])

    const service = new SubscriptionManagementService()
    const result = await service.getSubscriptions({ search: 'asha', status: 'ACTIVE', page: 1, pageSize: 10 })

    expect(result.subscriptions).toHaveLength(1)
    expect(result.subscriptions[0].studentName).toBe('Asha')
    expect(result.total).toBe(1)
  })

  it('upgrades a subscription and records an audit event', async () => {
    subscriptionServiceMock.upgradePlan.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-2',
      planName: 'Yearly',
      status: 'ACTIVE',
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-02-01'),
      renewalAttempts: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    const service = new SubscriptionManagementService()
    await service.upgradeSubscription('sub-1', 'plan-2', { id: 'admin-1', role: 'FINANCE_MANAGER' })

    expect(subscriptionServiceMock.upgradePlan).toHaveBeenCalledWith('sub-1', 'plan-2')
    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: 'subscription.upgraded',
    }))
  })

  it('pauses and resumes subscriptions with audit logging', async () => {
    subscriptionServiceMock.pauseSubscription.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      planName: 'Monthly',
      status: 'PAUSED',
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-02-01'),
      renewalAttempts: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })
    subscriptionServiceMock.resumeSubscription.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      planName: 'Monthly',
      status: 'ACTIVE',
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-02-01'),
      renewalAttempts: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    const service = new SubscriptionManagementService()
    await service.pauseSubscription('sub-1', { id: 'admin-1', role: 'SUPER_ADMIN' })
    await service.resumeSubscription('sub-1', { id: 'admin-1', role: 'SUPER_ADMIN' })

    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'subscription.paused' }))
    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'subscription.resumed' }))
  })
})
