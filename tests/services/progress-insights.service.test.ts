import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('progress-insights.service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/server/repositories/progress.repository')
    vi.unmock('@/server/repositories/exam-attempt.repository')
    vi.unmock('@/server/services/adaptive-learning.service')
  })

  it('builds insights for a normal student', async () => {
    const progressRepo = {
      findModuleProgressByUser: vi.fn().mockResolvedValue([{ id: 'mp1', percentComplete: 75 }]),
    }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([{ id: 'a1', status: 'SUBMITTED', percentage: 82 }]) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue({ performanceSummary: { recentAccuracy: 78, weakTopics: ['Fractions'] } }) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { getProgressInsights } = await import('../../server/services/progress-insights.service')
    const dto = await getProgressInsights('u1')

    expect(dto.readinessTrend[0].value).toBe(78)
    expect(dto.moduleCompletion[0].value).toBe(75)
    expect(dto.mockScoreTrend[0].value).toBe(82)
    expect(dto.topicMastery[0].label).toBe('Fractions')
  })

  it('returns empty insights for an empty student', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockResolvedValue([]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue(null) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { getProgressInsights } = await import('../../server/services/progress-insights.service')
    const dto = await getProgressInsights('u2')

    expect(dto.moduleCompletion[0].value).toBe(0)
    expect(dto.mockScoreTrend[0].value).toBe(0)
  })

  it('handles repository failures gracefully', async () => {
    const progressRepo = { findModuleProgressByUser: vi.fn().mockRejectedValue(new Error('boom')) }
    const examAttemptRepo = { listAttempts: vi.fn().mockRejectedValue(new Error('boom')) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockRejectedValue(new Error('boom')) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { getProgressInsights } = await import('../../server/services/progress-insights.service')
    const dto = await getProgressInsights('u3')

    expect(dto.readinessTrend[0].value).toBe(0)
    expect(dto.topicMastery[0].value).toBe(0)
  })
})
