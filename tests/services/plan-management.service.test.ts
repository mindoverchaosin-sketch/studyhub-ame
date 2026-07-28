import { beforeEach, describe, expect, it, vi } from 'vitest'

const planRepositoryMock = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
}))

const auditLogServiceMock = vi.hoisted(() => ({
  recordEvent: vi.fn(),
}))

vi.mock('@/server/domains/billing/plans/plan.repository', () => ({
  planRepository: planRepositoryMock,
}))

vi.mock('@/server/services/audit-log.service', () => ({
  auditLogService: auditLogServiceMock,
}))

import { PlanManagementService } from '@/server/services/plan-management.service'

describe('PlanManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a filtered and sorted plan directory', async () => {
    planRepositoryMock.findAll.mockResolvedValue([
      { id: 'p-2', slug: 'yearly', name: 'Yearly', interval: 'yearly', isActive: true, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-02-01'), productPrice: { amount: '4999', currency: 'INR' } },
      { id: 'p-1', slug: 'monthly', name: 'Monthly', interval: 'monthly', isActive: false, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-02-01'), productPrice: { amount: '499', currency: 'INR' } },
    ])

    const service = new PlanManagementService()
    const result = await service.getPlans({ status: 'ACTIVE', search: 'year' })

    expect(result.plans).toHaveLength(1)
    expect(result.plans[0].slug).toBe('yearly')
    expect(result.total).toBe(1)
  })

  it('updates plan pricing and metadata and records an audit event', async () => {
    planRepositoryMock.findById.mockResolvedValue({
      id: 'p-1',
      slug: 'monthly',
      name: 'Monthly',
      interval: 'monthly',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-02-01'),
      productPrice: { amount: '499', currency: 'INR', id: 'pp-1' },
    })
    planRepositoryMock.update.mockResolvedValue({
      id: 'p-1',
      slug: 'monthly',
      name: 'Monthly Pro',
      interval: 'yearly',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-02-02'),
      productPrice: { amount: '599', currency: 'INR', id: 'pp-1' },
    })

    const service = new PlanManagementService()
    const result = await service.updatePlan('p-1', {
      name: 'Monthly Pro',
      description: 'Updated description',
      price: 599,
      displayOrder: 12,
      features: ['premiumModules'],
      isActive: true,
    }, { id: 'admin-1', role: 'FINANCE_MANAGER' })

    expect(result.name).toBe('Monthly Pro')
    expect(result.price).toBe(599)
    expect(result.displayOrder).toBe(12)
    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: 'plan.updated',
      actorId: 'admin-1',
      actorRole: 'FINANCE_MANAGER',
    }))
  })

  it('toggles plan status and records activation or deactivation events', async () => {
    planRepositoryMock.findById.mockResolvedValue({
      id: 'p-1',
      slug: 'monthly',
      name: 'Monthly',
      interval: 'monthly',
      isActive: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-02-01'),
      productPrice: { amount: '499', currency: 'INR', id: 'pp-1' },
    })
    planRepositoryMock.update.mockResolvedValue({
      id: 'p-1',
      slug: 'monthly',
      name: 'Monthly',
      interval: 'monthly',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-02-02'),
      productPrice: { amount: '499', currency: 'INR', id: 'pp-1' },
    })

    const service = new PlanManagementService()
    const result = await service.togglePlanStatus('p-1', true, { id: 'admin-1', role: 'SUPER_ADMIN' })

    expect(result.isActive).toBe(true)
    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: 'plan.activated',
    }))
  })
})
