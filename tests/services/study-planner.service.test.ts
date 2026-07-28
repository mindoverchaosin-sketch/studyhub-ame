import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('study-planner.service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/server/repositories/progress.repository')
    vi.unmock('@/server/repositories/exam-attempt.repository')
    vi.unmock('@/server/repositories/module.repository')
    vi.unmock('@/server/services/adaptive-learning.service')
  })

  it('generates a daily plan for a normal student', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockResolvedValue([
        { id: 'lp1', percentComplete: 40, lesson: { title: 'Fractions', slug: 'fractions' } },
        { id: 'lp2', percentComplete: 70, lesson: { title: 'Decimals', slug: 'decimals' } },
      ]),
      findModuleProgressByUser: vi.fn().mockResolvedValue([{ id: 'mp1', moduleId: 'm1', percentComplete: 100 }]),
    }
    const moduleRepo = { findById: vi.fn().mockResolvedValue({ id: 'm1', title: 'Core Maths', slug: 'core-maths' }) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([{ id: 'a1', status: 'SUBMITTED', percentage: 60 }]) }
    const adaptiveService = {
      getAdaptiveLearningData: vi.fn().mockResolvedValue({
        performanceSummary: { weakTopics: ['Fractions'] },
        reviewQueue: [{ id: 'r1', title: 'Fractions review' }],
        recommendations: [{ id: 'rec1', title: 'Practice decimals' }],
      }),
    }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { generateDailyPlan } = await import('../../server/services/study-planner.service')
    const dto = await generateDailyPlan('u1')

    expect(dto.estimatedStudyMinutes).toBeGreaterThan(0)
    expect(dto.revisionTasks.length).toBeGreaterThan(0)
    expect(dto.practiceTasks.length).toBeGreaterThan(0)
    expect(dto.weakTopicTasks.some((task) => task.title.includes('Fractions'))).toBe(true)
    expect(dto.mockExamTask).not.toBeNull()
    expect(dto.generatedAt).toBeTruthy()
  })

  it('returns an empty plan for an empty student', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockResolvedValue([]),
      findModuleProgressByUser: vi.fn().mockResolvedValue([]),
    }
    const moduleRepo = { findById: vi.fn().mockResolvedValue(null) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue(null) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { generateDailyPlan } = await import('../../server/services/study-planner.service')
    const dto = await generateDailyPlan('u2')

    expect(dto.revisionTasks).toEqual([])
    expect(dto.practiceTasks).toEqual([])
    expect(dto.weakTopicTasks).toEqual([])
    expect(dto.mockExamTask).toBeNull()
  })

  it('handles missing adaptive data without crashing', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockResolvedValue([{ id: 'lp1', percentComplete: 40, lesson: { title: 'Fractions', slug: 'fractions' } }]),
      findModuleProgressByUser: vi.fn().mockResolvedValue([]),
    }
    const moduleRepo = { findById: vi.fn().mockResolvedValue(null) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockResolvedValue(null) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { generateDailyPlan } = await import('../../server/services/study-planner.service')
    const dto = await generateDailyPlan('u3')

    expect(dto.revisionTasks.length).toBeGreaterThan(0)
    expect(dto.estimatedStudyMinutes).toBeGreaterThan(0)
  })

  it('returns a safe fallback when repositories fail', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockRejectedValue(new Error('boom')),
      findModuleProgressByUser: vi.fn().mockRejectedValue(new Error('boom')),
    }
    const moduleRepo = { findById: vi.fn().mockRejectedValue(new Error('boom')) }
    const examAttemptRepo = { listAttempts: vi.fn().mockRejectedValue(new Error('boom')) }
    const adaptiveService = { getAdaptiveLearningData: vi.fn().mockRejectedValue(new Error('boom')) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => adaptiveService)

    const { generateDailyPlan } = await import('../../server/services/study-planner.service')
    const dto = await generateDailyPlan('u4')

    expect(dto.estimatedStudyMinutes).toBe(0)
    expect(dto.revisionTasks).toEqual([])
    expect(dto.practiceTasks).toEqual([])
    expect(dto.weakTopicTasks).toEqual([])
    expect(dto.mockExamTask).toBeNull()
  })
})
