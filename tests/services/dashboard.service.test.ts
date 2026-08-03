import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/services/cache', () => ({
  withServiceCache: async (cacheKey: string, ttlMs: number, loader: () => Promise<any>) => loader(),
  getCacheKey: vi.fn().mockImplementation((prefix: string, studentId: string) => `${prefix}:${studentId}`),
  invalidateServiceCache: vi.fn(),
}))

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
      findManyByIds: vi.fn().mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]),
    }

    const examAttemptRepo = {
      listAttempts: vi.fn().mockResolvedValue([
        { id: 'a1', status: 'SUBMITTED', percentage: 80 },
        { id: 'a2', status: 'SUBMITTED', percentage: 60 },
      ]),
      getAttemptQuestionsByAttemptIds: vi.fn().mockResolvedValue([{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]),
      getAttemptQuestions: vi.fn().mockResolvedValueOnce([{ id: 'q1' }, { id: 'q2' }]).mockResolvedValueOnce([{ id: 'q3' }]),
    }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => ({
      getAdaptiveLearningData: async () => ({ performanceSummary: { recentAccuracy: 78 }, reviewQueue: [{ id: 'r1' }, { id: 'r2' }] }),
    }))

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

    const moduleRepo = { findById: vi.fn().mockResolvedValue(null), findManyByIds: vi.fn().mockResolvedValue([]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]), getAttemptQuestions: vi.fn().mockResolvedValue([]) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => ({
      getAdaptiveLearningData: async () => null,
    }))

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

    const moduleRepo = { findById: vi.fn().mockResolvedValue({ id: 'm1' }), findManyByIds: vi.fn().mockResolvedValue([{ id: 'm1' }]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]), getAttemptQuestions: vi.fn().mockResolvedValue([]) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => ({
      getAdaptiveLearningData: async () => null,
    }))

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

    const moduleRepo = { findById: vi.fn().mockResolvedValue(null), findManyByIds: vi.fn().mockResolvedValue([]) }
    const examAttemptRepo = { listAttempts: vi.fn().mockResolvedValue([]), getAttemptQuestions: vi.fn().mockResolvedValue([]) }

    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepo }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepo }))
    vi.doMock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepo }))
    vi.doMock('@/server/services/adaptive-learning.service', () => ({
      getAdaptiveLearningData: async () => null,
    }))

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

  it('builds detailed student dashboard data from progress and activity', async () => {
    const userRepository = { findById: vi.fn().mockResolvedValue({ id: 'u1', displayName: 'Test Student', studentProfile: { fullName: 'Test Student', targetExam: 'DGCA' } }) }
    const progressRepository = {
      findProgressRowsByUser: vi.fn().mockResolvedValue([{ id: 'p1', userId: 'u1', courseId: 'c1', completionPercent: 50, status: 'IN_PROGRESS', updatedAt: new Date() }]),
      findLessonProgressByUser: vi.fn().mockResolvedValue([{ id: 'lp1', lessonId: 'l1', percentComplete: 50, updatedAt: new Date(), lesson: { id: 'l1', title: 'Intro', description: 'Desc', slug: 'intro' } }]),
      findModuleProgressByUser: vi.fn().mockResolvedValue([{ id: 'mp1', moduleId: 'm1', percentComplete: 50, updatedAt: new Date() }]),
      findRecentLessonProgress: vi.fn().mockResolvedValue([{ id: 'lp1', lessonId: 'l1', percentComplete: 50, updatedAt: new Date(), lesson: { id: 'l1', title: 'Intro', description: 'Desc', slug: 'intro' } }]),
      findRecentQuizAttempts: vi.fn().mockResolvedValue([{ id: 'qa1', score: 80, attemptedAt: new Date(), quiz: { title: 'Quiz 1' } }]),
      findStudyStreak: vi.fn().mockResolvedValue({ currentStreak: 2, longestStreak: 4 }),
    }

    const sectionRepository = { findById: vi.fn().mockResolvedValue({ id: 'l1', title: 'Intro', description: 'Desc', slug: 'intro', durationMinutes: 20, moduleId: 'm1' }) }
    const moduleRepository = { findById: vi.fn().mockResolvedValue({ id: 'm1', title: 'Module 1', slug: 'module-1' }) }
    const courseRepository = { findById: vi.fn().mockResolvedValue({ id: 'c1', title: 'Course 1', slug: 'course-1' }) }

    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/progress.repository', () => ({ progressRepository }))
    vi.doMock('@/server/repositories/section.repository', () => ({ sectionRepository }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository }))

    const { getStudentDashboardData } = await import('../../server/services/dashboard.service')
    const dto = await getStudentDashboardData('u1')

    expect(dto.welcome.studentName).toBe('Test Student')
    expect(dto.progress.courseCompletion).toBe(50)
    expect(dto.dailyGoal.weeklyStudyGoalMinutes).toBe(300)
    expect(dto.recentActivity.length).toBeGreaterThanOrEqual(1)
  })
})
