import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAnalyticsDashboardAction } from '@/server/actions/analytics.actions'
import * as authModule from '@/auth'
import * as analyticsService from '@/server/services/analytics.service'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  getDashboard: vi.fn(),
}))

vi.mock('@/auth', () => ({
  requirePermission: mocks.requirePermission,
}))

vi.mock('@/server/services/analytics.service', () => ({
  analyticsService: {
    getDashboard: mocks.getDashboard,
  },
}))

describe('Analytics Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAnalyticsDashboardAction', () => {
    it('should require viewAnalytics permission', async () => {
      mocks.requirePermission.mockResolvedValue(undefined)
      mocks.getDashboard.mockResolvedValue({
        students: {},
        learning: {},
        questionBank: {},
        mockExams: {},
        publishing: {},
        trends: {},
        generatedAt: new Date().toISOString(),
      })

      await getAnalyticsDashboardAction()

      expect(mocks.requirePermission).toHaveBeenCalledWith('viewAnalytics')
    })

    it('should return dashboard data after permission check', async () => {
      const dashboardData = {
        students: { totalStudents: 100, activeStudents: 95, newRegistrations: 15, registrationTrend: null },
        learning: { moduleCompletionRate: 45, resourceUsageCount: 230, mostStudiedModules: [] },
        questionBank: { totalQuestions: 500, byDifficulty: {}, byModule: [], recentlyAdded: [] },
        mockExams: { totalAttempts: 120, averageScore: 72.5, passRate: 65, completionRate: 85 },
        publishing: { draftCount: 20, publishedCount: 150, archivedCount: 30, byEntityType: {} },
        trends: { dailyRegistrations: null, dailyExamAttempts: null, dailyStudySessions: null },
        generatedAt: new Date().toISOString(),
      }

      mocks.requirePermission.mockResolvedValue(undefined)
      mocks.getDashboard.mockResolvedValue(dashboardData)

      const result = await getAnalyticsDashboardAction()

      expect(result).toEqual(dashboardData)
    })

    it('should throw error when permission is denied', async () => {
      const permissionError = new Error('Permission denied')
      mocks.requirePermission.mockRejectedValue(permissionError)

      await expect(getAnalyticsDashboardAction()).rejects.toThrow('Permission denied')
      expect(mocks.getDashboard).not.toHaveBeenCalled()
    })
  })
})
