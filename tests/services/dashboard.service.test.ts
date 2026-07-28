import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('dashboard.service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('aggregates dashboard summary data from repositories', async () => {
    const progressRepo = {
      findModuleProgressByUser: vi.fn().mockResolvedValue([
        { id: 'mp1', moduleId: 'm1', percentComplete: 100 },
        { id: 'mp2', moduleId: 'm2', percentComplete: 60 },
      ]),
      findLessonProgressByUser: vi.fn().mockResolvedValue([
        { id: 'lp1', percentComplete: 100 },
        { id: 'lp2', percentComplete: 80 },
      ]),
      findStudyStreak: vi.fn().mockResolvedValue({ currentStreak: 4, longestStreak: 7 }),
    }

    const moduleRepo = {
      findById: vi.fn().mockResolvedValue({ id: 'm1' }),
    }

    const examAttemptRepo = {
      listAttempts: vi.fn().mockResolvedValue([
        { id: 'a1', status: 'SUBMITTED', percentage: 80 },
        { id: 'a2', status: 'SUBMITTED', percentage: 60 },
      ]),
      getAttemptQuestions: vi.fn().mockResolvedValueOnce([{ id: 'q1' }, { id: 'q2' }]).mockResolvedValueOnce([{ id: 'q3' }]),
    }

    const adaptiveService = {
      getAdaptiveLearningData: vi.fn().mockResolvedValue({ performanceSummary: { recentAccuracy: 78 }, reviewQueue: [{ id: 'r1' }, { id: 'r2' }] }),
    }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { getDashboardSummary } = await import('../../server/services/dashboard.service')
    const dto = await getDashboardSummary('u1')

    expect(dto.readinessScore).toBe(78)
    expect(dto.currentStreak).toBe(4)
    expect(dto.longestStreak).toBe(7)
    expect(dto.modulesCompleted).toBe(1)
    expect(dto.totalModules).toBe(2)
    expect(dto.questionsSolved).toBe(3)
    expect(dto.mockExamsTaken).toBe(2)
    expect(dto.averageMockScore).toBe(70)
    expect(dto.revisionQueueCount).toBe(2)
    expect(dto.weeklyStudyMinutes).toBeGreaterThan(0)
  })

  it('returns zeroed values for an empty student', async () => {
    const progressRepo = {
      findModuleProgressByUser: vi.fn().mockResolvedValue([]),
      findLessonProgressByUser: vi.fn().mockResolvedValue([]),
      findStudyStreak: vi.fn().mockResolvedValue(null),
    }

    const moduleRepo = { findById: vi.fn().mockResolvedValue(null) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]), getAttemptQuestions: vi.fn().mockResolvedValue([]) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue(null) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { getDashboardSummary } = await import('../../server/services/dashboard.service')
    const dto = await getDashboardSummary('u2')

    expect(dto).toEqual({
      readinessScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      modulesCompleted: 0,
      totalModules: 0,
      questionsSolved: 0,
      mockExamsTaken: 0,
      averageMockScore: 0,
      revisionQueueCount: 0,
      weeklyStudyMinutes: 0,
    })
  })

  it('handles missing adaptive data', async () => {
    const progressRepo = {
      findModuleProgressByUser: vi.fn().mockResolvedValue([{ id: 'mp1', moduleId: 'm1', percentComplete: 100 }]),
      findLessonProgressByUser: vi.fn().mockResolvedValue([{ id: 'lp1', percentComplete: 50 }]),
      findStudyStreak: vi.fn().mockResolvedValue({ currentStreak: 1, longestStreak: 1 }),
    }

    const moduleRepo = { findById: vi.fn().mockResolvedValue({ id: 'm1' }) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]), getAttemptQuestions: vi.fn().mockResolvedValue([]) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue(null) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { getDashboardSummary } = await import('../../server/services/dashboard.service')
    const dto = await getDashboardSummary('u3')

    expect(dto.readinessScore).toBe(0)
    expect(dto.revisionQueueCount).toBe(0)
  })

  it('returns a safe fallback when repositories fail', async () => {
    const progressRepo = {
      findModuleProgressByUser: vi.fn().mockRejectedValue(new Error('boom')),
      findLessonProgressByUser: vi.fn().mockResolvedValue([]),
      findStudyStreak: vi.fn().mockResolvedValue(null),
    }

    const moduleRepo = { findById: vi.fn().mockResolvedValue(null) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]), getAttemptQuestions: vi.fn().mockResolvedValue([]) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue(null) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { getDashboardSummary } = await import('../../server/services/dashboard.service')
    const dto = await getDashboardSummary('u4')

    expect(dto).toEqual({
      readinessScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      modulesCompleted: 0,
      totalModules: 0,
      questionsSolved: 0,
      mockExamsTaken: 0,
      averageMockScore: 0,
      revisionQueueCount: 0,
      weeklyStudyMinutes: 0,
    })
  })
})
