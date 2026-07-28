import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('achievement.service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/server/repositories/progress.repository')
    vi.unmock('@/server/repositories/exam-attempt.repository')
    vi.unmock('@/server/services/dashboard.service')
    vi.unmock('@/server/services/adaptive-learning.service')
    vi.unmock('@/server/services/goal-tracking.service')
  })

  it('returns unlocked and locked achievements for a normal student', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockResolvedValue([{ id: 'mp1', percentComplete: 100 }]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([{ id: 'a1', status: 'SUBMITTED', percentage: 95 }]) }
    const dashboardService = { getDashboardSummary: vi.fn().mockResolvedValue({ questionsSolved: 150, currentStreak: 8, averageMockScore: 95 }) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue({ performanceSummary: { recentAccuracy: 88 }, reviewQueue: [{ id: 'r1' }] }) }
    const goalService = { getGoalProgress: vi.fn().mockResolvedValue({ completionPercentage: 50 }) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/dashboard.service', () => dashboardService)
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)
    vi.doMock('@/server/services/goal-tracking.service', () => goalService)

    const { evaluateAchievements } = await import('../../server/services/achievement.service')
    const achievements = await evaluateAchievements('u1')

    expect(achievements.some((item) => item.id === 'first-mock-exam' && item.unlocked)).toBe(true)
    expect(achievements.some((item) => item.id === 'thousand-questions-solved' && !item.unlocked)).toBe(true)
  })

  it('prevents duplicate unlock state and tracks progress', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockResolvedValue([]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]) }
    const dashboardService = { getDashboardSummary: vi.fn().mockResolvedValue({ questionsSolved: 50, currentStreak: 3, averageMockScore: 70 }) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue(null) }
    const goalService = { getGoalProgress: vi.fn().mockResolvedValue({ completionPercentage: 0 }) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/dashboard.service', () => dashboardService)
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)
    vi.doMock('@/server/services/goal-tracking.service', () => goalService)

    const { evaluateAchievements } = await import('../../server/services/achievement.service')
    const achievements = await evaluateAchievements('u2')

    expect(achievements.filter((item) => item.unlocked).length).toBe(0)
    expect(achievements.find((item) => item.id === 'hundred-questions-solved')?.progress).toBe(50)
  })

  it('handles repository failures gracefully', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockRejectedValue(new Error('boom')) }
    const examAttemptRepo = { listAttempts: vi.fn().mockRejectedValue(new Error('boom')) }
    const dashboardService = { getDashboardSummary: vi.fn().mockRejectedValue(new Error('boom')) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockRejectedValue(new Error('boom')) }
    const goalService = { getGoalProgress: vi.fn().mockRejectedValue(new Error('boom')) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/dashboard.service', () => dashboardService)
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)
    vi.doMock('@/server/services/goal-tracking.service', () => goalService)

    const { getAchievements } = await import('../../server/services/achievement.service')
    const summary = await getAchievements('u3')

    expect(summary.totalUnlocked).toBe(0)
    expect(summary.totalAvailable).toBe(9)
    expect(summary.completionPercentage).toBe(0)
    expect(summary.inProgressAchievements.length).toBe(4)
  })
})
