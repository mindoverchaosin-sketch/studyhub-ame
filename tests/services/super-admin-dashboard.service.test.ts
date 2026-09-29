import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCalls } = vi.hoisted(() => ({
  mockCalls: {
    countManyForAdmin: vi.fn(),
    getAdminsByStatus: vi.fn(),
    getInstructorsByStatus: vi.fn(),
    getPublishingAnalytics: vi.fn(),
    countActiveExamTemplates: vi.fn(),
    getBillingDashboard: vi.fn(),
    listAuditLogs: vi.fn(),
    listUsers: vi.fn(),
  },
}))

vi.mock('@/server/repositories/user.repository', () => ({ userRepository: { countManyForAdmin: mockCalls.countManyForAdmin } }))
vi.mock('@/server/services/approval-management.service', () => ({ getAdminsByStatus: mockCalls.getAdminsByStatus, getInstructorsByStatus: mockCalls.getInstructorsByStatus }))
vi.mock('@/server/services/analytics.service', () => ({ analyticsService: { getPublishingAnalytics: mockCalls.getPublishingAnalytics } }))
vi.mock('@/server/repositories/exam-template.repository', () => ({ examTemplateRepository: { countTemplates: mockCalls.countActiveExamTemplates } }))
vi.mock('@/server/services/billing-dashboard.service', () => ({ billingDashboardService: { getBillingDashboard: mockCalls.getBillingDashboard } }))
vi.mock('@/server/services/audit-log.service', () => ({ auditLogService: { listAuditLogs: mockCalls.listAuditLogs } }))
vi.mock('@/server/services/user-management.service', () => ({ listUsers: mockCalls.listUsers }))

describe('Super Admin dashboard data service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCalls.countManyForAdmin.mockResolvedValue(0)
    mockCalls.getAdminsByStatus.mockResolvedValue([])
    mockCalls.getInstructorsByStatus.mockResolvedValue([])
    mockCalls.getPublishingAnalytics.mockResolvedValue({ publishedCount: 0 })
    mockCalls.countActiveExamTemplates.mockResolvedValue(0)
    mockCalls.getBillingDashboard.mockResolvedValue({ overview: { activeSubscriptions: 0, monthlyRecurringRevenue: 0 } })
    mockCalls.listAuditLogs.mockResolvedValue({ auditLogs: [], total: 0 })
    mockCalls.listUsers.mockResolvedValue({ items: [], totalItems: 0, page: 1, pageSize: 6, totalPages: 1 })
  })

  it('uses existing services and reports their actual values without estimates presented as facts', async () => {
    mockCalls.countManyForAdmin.mockImplementation(async (filter?: { role?: string }) => {
      if (filter?.role === 'STUDENT') return 42
      if (filter?.role === 'ADMIN') return 4
      if (filter?.role === 'CONTENT_EDITOR') return 3
      return 50
    })
    mockCalls.getAdminsByStatus.mockResolvedValue([{ id: 'admin-1', displayName: 'A. Admin', email: 'admin@example.com', createdAt: new Date('2026-01-02T00:00:00Z'), adminProfile: { status: 'PENDING' }, isActive: true }])
    mockCalls.getInstructorsByStatus.mockResolvedValue([{ id: 'instructor-1', displayName: 'I. Instructor', email: 'instructor@example.com', createdAt: new Date('2026-01-03T00:00:00Z'), instructorProfile: { status: 'PENDING' }, isActive: true }])
    mockCalls.getPublishingAnalytics.mockResolvedValue({ publishedCount: 18 })
    mockCalls.countActiveExamTemplates.mockResolvedValue(2)
    mockCalls.getBillingDashboard.mockResolvedValue({ overview: { activeSubscriptions: 7, monthlyRecurringRevenue: 1234 } })
    mockCalls.listAuditLogs.mockResolvedValue({ auditLogs: [{ id: 'event-1' }], total: 1 })
    mockCalls.listUsers.mockResolvedValue({ items: [{ id: 'user-1' }], totalItems: 1, page: 1, pageSize: 6, totalPages: 1 })

    const { getSuperAdminDashboardData } = await import('@/server/services/super-admin-dashboard.service')
    const dashboard = await getSuperAdminDashboardData()

    expect(dashboard.metrics).toMatchObject({
      totalUsers: 50,
      students: 42,
      administrators: 4,
      contentEditors: 3,
      pendingApprovals: 2,
      publishedContent: 18,
      activeExamTemplates: 2,
      activeSubscriptions: 7,
      estimatedMonthlyRecurringRevenue: 1234,
    })
    expect(dashboard.pendingApprovals[0]).toMatchObject({ name: 'I. Instructor', status: 'PENDING', role: 'INSTRUCTOR' })
    expect(dashboard.recentAuditEvents).toHaveLength(1)
    expect(dashboard.recentUsers).toHaveLength(1)
    expect(mockCalls.listAuditLogs).toHaveBeenCalledWith({ page: 1, pageSize: 6 })
  })
})