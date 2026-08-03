import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { DashboardDTO, DashboardSummaryDTO } from '@/server/application/dto/dashboard.dto'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  requireOwnership: vi.fn(),
  getDashboardSummary: vi.fn(),
  getStudentDashboardData: vi.fn(),
}))

vi.mock('@/auth', () => ({
  requireStudent: mocks.requireStudent,
  requireOwnership: mocks.requireOwnership,
}))

vi.mock('@/server/services/dashboard.service', () => ({
  getDashboardSummary: mocks.getDashboardSummary,
  getStudentDashboardData: mocks.getStudentDashboardData,
}))

describe('dashboard actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return student dashboard summary after ownership check', async () => {
    const dashboardSummary: DashboardSummaryDTO = {
      readinessScore: 82,
      currentStreak: 3,
      longestStreak: 5,
      modulesCompleted: 2,
      totalModules: 4,
      questionsSolved: 25,
      mockExamsTaken: 1,
      averageMockScore: 78,
      revisionQueueCount: 2,
      weeklyStudyMinutes: 120,
    }

    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1' } })
    mocks.requireOwnership.mockReturnValue(undefined)
    mocks.getDashboardSummary.mockResolvedValue(dashboardSummary)

    const { getDashboardSummaryAction } = await import('../../server/actions/dashboard.actions')
    const result = await getDashboardSummaryAction('student-1')

    expect(result).toEqual(dashboardSummary)
    expect(mocks.requireStudent).toHaveBeenCalled()
    expect(mocks.requireOwnership).toHaveBeenCalledWith('student-1', 'student-1')
    expect(mocks.getDashboardSummary).toHaveBeenCalledWith('student-1')
  })

  it('should return detailed student dashboard data after ownership check', async () => {
    const dashboardData: DashboardDTO = {
      welcome: { studentName: 'Test Student', targetExam: 'DGCA' },
      continueLearning: [],
      progress: { courseCompletion: 90, moduleCompletion: 75, lessonCompletion: 80, quizScore: 88 },
      dailyGoal: { minutesStudiedToday: 45, dailyTarget: 60, remainingTime: 15, weeklyStudyGoalMinutes: 300 },
      studyStreak: { currentStreak: 4, longestStreak: 7, weeklyCalendar: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] },
      recentActivity: [{ title: 'Reviewed lesson', detail: 'Completed 2 lessons', time: '2h ago' }],
    }

    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-2' } })
    mocks.requireOwnership.mockReturnValue(undefined)
    mocks.getStudentDashboardData.mockResolvedValue(dashboardData)

    const { getStudentDashboardDataAction } = await import('../../server/actions/dashboard.actions')
    const result = await getStudentDashboardDataAction('student-2')

    expect(result).toEqual(dashboardData)
    expect(mocks.requireStudent).toHaveBeenCalled()
    expect(mocks.requireOwnership).toHaveBeenCalledWith('student-2', 'student-2')
    expect(mocks.getStudentDashboardData).toHaveBeenCalledWith('student-2')
  })

  it('should reject when session user is not authorized to access another student dashboard', async () => {
    const forbiddenError = new Error('Forbidden')
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1' } })
    mocks.requireOwnership.mockImplementation(() => { throw forbiddenError })

    const { getDashboardSummaryAction } = await import('../../server/actions/dashboard.actions')

    await expect(getDashboardSummaryAction('student-2')).rejects.toThrow('Forbidden')
    expect(mocks.getDashboardSummary).not.toHaveBeenCalled()
  })
})
