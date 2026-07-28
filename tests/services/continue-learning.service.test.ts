import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('continue-learning.service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unmock('@/server/repositories/progress.repository')
    vi.unmock('@/server/repositories/exam-attempt.repository')
    vi.unmock('@/server/repositories/module.repository')
    vi.unmock('@/server/repositories/section.repository')
  })

  it('builds continue-learning data for a normal student', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockResolvedValue([
        { id: 'lp1', lessonId: 'l1', percentComplete: 60, lesson: { title: 'Fractions Basics', slug: 'fractions-basics' } },
      ]),
      findModuleProgressByUser: vi.fn().mockResolvedValue([{ id: 'mp1', moduleId: 'm1', percentComplete: 70 }]),
    }
    const moduleRepo = { findById: vi.fn().mockResolvedValue({ id: 'm1', title: 'Core Maths', slug: 'core-maths' }) }
    const sectionRepo = { findById: vi.fn().mockResolvedValue({ id: 'l1', title: 'Fractions Basics', slug: 'fractions-basics' }) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([{ id: 'a1', status: 'SUBMITTED', percentage: 72 }]) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/section.repository', () => ({ sectionRepository: sectionRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))

    const { getContinueLearning } = await import('../../server/services/continue-learning.service')
    const dto = await getContinueLearning('u1')

    expect(dto.lastModule).toBe('Core Maths')
    expect(dto.lastLesson).toBe('Fractions Basics')
    expect(dto.lastMockExam).toBe(72)
    expect(dto.resumeUrl).toContain('/student')
  })

  it('returns empty continue-learning data for an empty student', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockResolvedValue([]),
      findModuleProgressByUser: vi.fn().mockResolvedValue([]),
    }
    const moduleRepo = { findById: vi.fn().mockResolvedValue(null) }
    const sectionRepo = { findById: vi.fn().mockResolvedValue(null) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/section.repository', () => ({ sectionRepository: sectionRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))

    const { getContinueLearning } = await import('../../server/services/continue-learning.service')
    const dto = await getContinueLearning('u2')

    expect(dto.lastModule).toBeNull()
    expect(dto.lastLesson).toBeNull()
    expect(dto.lastQuiz).toBeNull()
    expect(dto.lastMockExam).toBeNull()
    expect(dto.resumeUrl).toBe('/student/dashboard')
  })

  it('handles repository failures gracefully', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockRejectedValue(new Error('boom')),
      findModuleProgressByUser: vi.fn().mockRejectedValue(new Error('boom')),
    }
    const moduleRepo = { findById: vi.fn().mockRejectedValue(new Error('boom')) }
    const sectionRepo = { findById: vi.fn().mockRejectedValue(new Error('boom')) }
    const examAttemptRepo = { listAttempts: vi.fn().mockRejectedValue(new Error('boom')) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/section.repository', () => ({ sectionRepository: sectionRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))

    const { getContinueLearning } = await import('../../server/services/continue-learning.service')
    const dto = await getContinueLearning('u3')

    expect(dto.lastModule).toBeNull()
    expect(dto.lastLesson).toBeNull()
    expect(dto.lastQuiz).toBeNull()
    expect(dto.lastMockExam).toBeNull()
    expect(dto.resumeUrl).toBe('/student/dashboard')
  })
})
