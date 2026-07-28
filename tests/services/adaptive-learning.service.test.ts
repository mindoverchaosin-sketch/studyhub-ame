import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('adaptive-learning.service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds an adaptive learning DTO from repository data', async () => {
    const progressRepo = {
      findLessonProgressByUser: vi.fn().mockResolvedValue([
        { id: 'lp1', userId: 'u1', lessonId: 'l1', status: 'IN_PROGRESS', percentComplete: 42, updatedAt: new Date('2024-01-05T00:00:00Z'), lesson: { id: 'l1', title: 'Pressure systems', slug: 'pressure-systems', moduleId: 'm1' } },
        { id: 'lp2', userId: 'u1', lessonId: 'l2', status: 'IN_PROGRESS', percentComplete: 85, updatedAt: new Date('2024-01-04T00:00:00Z'), lesson: { id: 'l2', title: 'Hydraulics', slug: 'hydraulics', moduleId: 'm1' } },
      ]),
      findModuleProgressByUser: vi.fn().mockResolvedValue([
        { id: 'mp1', userId: 'u1', moduleId: 'm1', status: 'IN_PROGRESS', percentComplete: 62, updatedAt: new Date('2024-01-05T00:00:00Z') },
      ]),
      findRecentQuizAttempts: vi.fn().mockResolvedValue([
        { id: 'qa1', userId: 'u1', quizId: 'q1', score: 54, passed: false, attemptedAt: new Date('2024-01-05T00:00:00Z'), quiz: { id: 'q1', title: 'Airframes basics', moduleId: 'm1' } },
        { id: 'qa2', userId: 'u1', quizId: 'q2', score: 88, passed: true, attemptedAt: new Date('2024-01-04T00:00:00Z'), quiz: { id: 'q2', title: 'Electrics recap', moduleId: 'm1' } },
      ]),
    }

    const moduleRepo = { findById: vi.fn().mockResolvedValue({ id: 'm1', title: 'Airframes', slug: 'airframes' }) }
    const sectionRepo = { findById: vi.fn().mockResolvedValue({ id: 'l1', title: 'Pressure systems', slug: 'pressure-systems', description: 'A tricky topic', durationMinutes: 18, moduleId: 'm1' }) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/section.repository', () => ({ sectionRepository: sectionRepo }))

    const { getAdaptiveLearningData } = await import('../../server/services/adaptive-learning.service')
    const dto = await getAdaptiveLearningData('u1')

    expect(dto.reviewQueue.length).toBeGreaterThan(0)
    expect(dto.reviewQueue[0].priority).toBe('high')
    expect(dto.recommendations[0].type).toBe('revision')
    expect(dto.performanceSummary.recentAccuracy).toBe(71)
    expect(dto.goals.daily.target).toBe(45)
    expect(dto.spacedRepetition[0].title).toContain('Pressure')
  })
})
