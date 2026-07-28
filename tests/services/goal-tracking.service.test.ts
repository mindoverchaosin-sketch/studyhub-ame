import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('goal-tracking.service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/server/repositories/progress.repository')
    vi.unmock('@/server/repositories/exam-attempt.repository')
  })

  it('calculates goal progress for a normal student', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockResolvedValue([{ id: 'mp1', percentComplete: 100 }, { id: 'mp2', percentComplete: 60 }]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([{ id: 'a1', status: 'SUBMITTED' }, { id: 'a2', status: 'SUBMITTED' }]) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))

    const { getGoalProgress } = await import('../../server/services/goal-tracking.service')
    const dto = await getGoalProgress('u1')

    expect(dto.modulesCompleted).toBe(1)
    expect(dto.weeklyMocksCompleted).toBe(2)
    expect(dto.completionPercentage).toBe(25)
  })

  it('updates goals and preserves the latest values', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockResolvedValue([]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))

    const { updateGoals } = await import('../../server/services/goal-tracking.service')
    const dto = await updateGoals('u2', { dailyQuestionGoal: 30, weeklyStudyGoalMinutes: 300 })

    expect(dto.dailyQuestionGoal).toBe(30)
    expect(dto.weeklyStudyGoalMinutes).toBe(300)
  })

  it('handles repository failures gracefully', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockRejectedValue(new Error('boom')) }
    const examAttemptRepo = { listAttempts: vi.fn().mockRejectedValue(new Error('boom')) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))

    const { getGoalProgress } = await import('../../server/services/goal-tracking.service')
    const dto = await getGoalProgress('u3')

    expect(dto.modulesCompleted).toBe(0)
    expect(dto.weeklyMocksCompleted).toBe(0)
    expect(dto.completionPercentage).toBe(0)
  })
})
