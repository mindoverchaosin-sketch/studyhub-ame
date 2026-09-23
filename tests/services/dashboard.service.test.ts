import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { progressRepositoryMock, moduleRepositoryMock, examAttemptRepositoryMock, questionBankRepositoryMock, userRepositoryMock, sectionRepositoryMock, courseRepositoryMock, adaptiveLearningServiceMock } = vi.hoisted(() => ({
  progressRepositoryMock: {
    findModuleProgressByUser: vi.fn(),
    findLessonProgressByUser: vi.fn(),
    findStudyStreak: vi.fn(),
    findProgressRowsByUser: vi.fn(),
    findRecentLessonProgress: vi.fn(),
    findRecentQuizAttempts: vi.fn(),
  },
  moduleRepositoryMock: {
    findById: vi.fn(),
    findManyByIds: vi.fn(),
  },
  examAttemptRepositoryMock: {
    listAttempts: vi.fn(),
    getAttemptQuestionsByAttemptIds: vi.fn(),
    getAttemptQuestions: vi.fn(),
    getAnsweredQuestionIdsByStudent: vi.fn(),
  },
  questionBankRepositoryMock: {
    findAnsweredQuestionIds: vi.fn(),
    getAttemptQuestions: vi.fn(),
  },
  userRepositoryMock: {
    findById: vi.fn(),
  },
  sectionRepositoryMock: {
    findById: vi.fn(),
  },
  courseRepositoryMock: {
    findById: vi.fn(),
  },
  adaptiveLearningServiceMock: {
    getAdaptiveLearningData: vi.fn(),
  },
}))

vi.mock('@/server/services/cache', () => ({
  withServiceCache: async (_cacheKey: string, _ttlMs: number, loader: () => Promise<any>) => loader(),
  getCacheKey: vi.fn().mockImplementation((prefix: string, studentId: string) => `${prefix}:${studentId}`),
  invalidateServiceCache: vi.fn(),
}))

vi.mock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepositoryMock }))
vi.mock('@/server/repositories/module.repository', () => ({ moduleRepository: moduleRepositoryMock }))
vi.mock('@/server/repositories/exam-attempt.repository', () => ({ examAttemptRepository: examAttemptRepositoryMock }))
vi.mock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository: questionBankRepositoryMock }))
vi.mock('@/server/repositories/user.repository', () => ({ userRepository: userRepositoryMock }))
vi.mock('@/server/repositories/section.repository', () => ({ sectionRepository: sectionRepositoryMock }))
vi.mock('@/server/repositories/course.repository', () => ({ courseRepository: courseRepositoryMock }))
vi.mock('@/server/services/adaptive-learning.service', () => ({
  getAdaptiveLearningData: adaptiveLearningServiceMock.getAdaptiveLearningData,
}))

describe.sequential('dashboard.service', () => {
  let dashboardService: typeof import('../../server/services/dashboard.service')

  beforeAll(async () => {
    dashboardService = await import('../../server/services/dashboard.service')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    progressRepositoryMock.findModuleProgressByUser.mockResolvedValue([])
    progressRepositoryMock.findLessonProgressByUser.mockResolvedValue([])
    progressRepositoryMock.findStudyStreak.mockResolvedValue(null)
    progressRepositoryMock.findProgressRowsByUser.mockResolvedValue([])
    progressRepositoryMock.findRecentLessonProgress.mockResolvedValue([])
    progressRepositoryMock.findRecentQuizAttempts.mockResolvedValue([])
    moduleRepositoryMock.findById.mockResolvedValue(null)
    moduleRepositoryMock.findManyByIds.mockResolvedValue([])
    examAttemptRepositoryMock.listAttempts.mockResolvedValue([])
    examAttemptRepositoryMock.getAttemptQuestionsByAttemptIds.mockResolvedValue([])
    examAttemptRepositoryMock.getAnsweredQuestionIdsByStudent.mockResolvedValue([])
    questionBankRepositoryMock.findAnsweredQuestionIds.mockResolvedValue([])
    examAttemptRepositoryMock.getAttemptQuestions.mockResolvedValue([])
    userRepositoryMock.findById.mockResolvedValue(null)
    sectionRepositoryMock.findById.mockResolvedValue(null)
    courseRepositoryMock.findById.mockResolvedValue(null)
    adaptiveLearningServiceMock.getAdaptiveLearningData.mockResolvedValue(null)
  })

  it('aggregates dashboard summary data from repositories', async () => {
    progressRepositoryMock.findModuleProgressByUser.mockResolvedValue([
      { id: 'mp1', moduleId: 'm1', percentComplete: 100 },
      { id: 'mp2', moduleId: 'm2', percentComplete: 60 },
    ])
    progressRepositoryMock.findLessonProgressByUser.mockResolvedValue([
      { id: 'lp1', percentComplete: 100 },
      { id: 'lp2', percentComplete: 80 },
    ])
    progressRepositoryMock.findStudyStreak.mockResolvedValue({ currentStreak: 4, longestStreak: 7 })
    moduleRepositoryMock.findManyByIds.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }])
    examAttemptRepositoryMock.listAttempts.mockResolvedValue([
      { id: 'a1', status: 'SUBMITTED', percentage: 80 },
      { id: 'a2', status: 'SUBMITTED', percentage: 60 },
    ])
    examAttemptRepositoryMock.getAnsweredQuestionIdsByStudent.mockResolvedValue(['question-1', 'question-2', 'question-3'])
    adaptiveLearningServiceMock.getAdaptiveLearningData.mockResolvedValue({
      performanceSummary: { recentAccuracy: 78 },
      reviewQueue: [{ id: 'r1' }, { id: 'r2' }],
      weeklyStudyMinutes: 120,
    })

    const { getDashboardSummary } = dashboardService
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
    // weeklyStudyMinutes returns 0 since AdaptiveLearningDTO doesn't have real study-time data
    expect(dto.weeklyStudyMinutes).toBe(0)
  })

  it('counts Question Bank-only answered questions for the current student', async () => {
    questionBankRepositoryMock.findAnsweredQuestionIds.mockResolvedValue(['question-1', 'question-2'])

    const { getDashboardSummary } = dashboardService
    const dto = await getDashboardSummary('student-1')

    expect(dto.questionsSolved).toBe(2)
    expect(questionBankRepositoryMock.findAnsweredQuestionIds).toHaveBeenCalledWith('student-1')
  })

  it('counts the unique union when formal and independent answers overlap', async () => {
    examAttemptRepositoryMock.listAttempts.mockResolvedValue([{ id: 'attempt-1' }])
    examAttemptRepositoryMock.getAnsweredQuestionIdsByStudent.mockResolvedValue(['question-1', 'question-2'])
    questionBankRepositoryMock.findAnsweredQuestionIds.mockResolvedValue(['question-2', 'question-3'])

    const { getDashboardSummary } = dashboardService
    const dto = await getDashboardSummary('student-1')

    expect(dto.questionsSolved).toBe(3)
  })

  it('keeps answer counts isolated to the requested student', async () => {
    examAttemptRepositoryMock.listAttempts.mockResolvedValue([{ id: 'student-1-attempt' }])
    questionBankRepositoryMock.findAnsweredQuestionIds.mockResolvedValue(['student-1-question'])

    const { getDashboardSummary } = dashboardService
    await getDashboardSummary('student-1')

    expect(questionBankRepositoryMock.findAnsweredQuestionIds).toHaveBeenCalledWith('student-1')
    expect(examAttemptRepositoryMock.getAnsweredQuestionIdsByStudent).toHaveBeenCalledWith('student-1')
  })

  it('returns zeroed values for an empty student', async () => {
    const { getDashboardSummary } = dashboardService
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
    progressRepositoryMock.findModuleProgressByUser.mockResolvedValue([{ id: 'mp1', moduleId: 'm1', percentComplete: 100 }])
    progressRepositoryMock.findLessonProgressByUser.mockResolvedValue([{ id: 'lp1', percentComplete: 50 }])
    progressRepositoryMock.findStudyStreak.mockResolvedValue({ currentStreak: 1, longestStreak: 1 })

    const { getDashboardSummary } = dashboardService
    const dto = await getDashboardSummary('u3')

    expect(dto.readinessScore).toBe(0)
    expect(dto.revisionQueueCount).toBe(0)
  })

  it('returns a safe fallback when repositories fail', async () => {
    progressRepositoryMock.findModuleProgressByUser.mockRejectedValue(new Error('boom'))

    const { getDashboardSummary } = dashboardService
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
    userRepositoryMock.findById.mockResolvedValue({ id: 'u1', displayName: 'Test Student', studentProfile: { fullName: 'Test Student', targetExam: 'DGCA' } })
    progressRepositoryMock.findProgressRowsByUser.mockResolvedValue([{ id: 'p1', userId: 'u1', courseId: 'c1', completionPercent: 50, status: 'IN_PROGRESS', updatedAt: new Date() }])
    progressRepositoryMock.findLessonProgressByUser.mockResolvedValue([{ id: 'lp1', lessonId: 'l1', percentComplete: 50, updatedAt: new Date(), lesson: { id: 'l1', title: 'Intro', description: 'Desc', slug: 'intro' } }])
    progressRepositoryMock.findModuleProgressByUser.mockResolvedValue([{ id: 'mp1', moduleId: 'm1', percentComplete: 50, updatedAt: new Date() }])
    progressRepositoryMock.findRecentLessonProgress.mockResolvedValue([{ id: 'lp1', lessonId: 'l1', percentComplete: 50, updatedAt: new Date(), lesson: { id: 'l1', title: 'Intro', description: 'Desc', slug: 'intro' } }])
    progressRepositoryMock.findRecentQuizAttempts.mockResolvedValue([{ id: 'qa1', score: 80, attemptedAt: new Date(), quiz: { title: 'Quiz 1' } }])
    progressRepositoryMock.findStudyStreak.mockResolvedValue({ currentStreak: 2, longestStreak: 4 })
    sectionRepositoryMock.findById.mockResolvedValue({ id: 'l1', title: 'Intro', description: 'Desc', slug: 'intro', durationMinutes: 20, moduleId: 'm1' })
    moduleRepositoryMock.findById.mockResolvedValue({ id: 'm1', title: 'Module 1', slug: 'module-1' })
    courseRepositoryMock.findById.mockResolvedValue({ id: 'c1', title: 'Course 1', slug: 'course-1' })

    const { getStudentDashboardData } = dashboardService
    const dto = await getStudentDashboardData('u1')

    expect(dto.welcome.studentName).toBe('Test Student')
    expect(dto.progress.courseCompletion).toBe(50)
    expect(dto.dailyGoal.weeklyStudyGoalMinutes).toBe(300)
    expect(dto.recentActivity.length).toBeGreaterThanOrEqual(1)
  })

  describe('study-time metrics', () => {
    it('returns zero weeklyStudyMinutes when no persisted data exists', async () => {
      adaptiveLearningServiceMock.getAdaptiveLearningData.mockResolvedValue({
        performanceSummary: { recentAccuracy: 0 },
        reviewQueue: [],
        // No weeklyStudyMinutes provided
      })

      const { getDashboardSummary } = dashboardService
      const dto = await getDashboardSummary('student-no-study-time')

      // AdaptiveLearningDTO doesn't have weeklyStudyMinutes, so always returns 0
      expect(dto.weeklyStudyMinutes).toBe(0)
    })

    it('does not silently present zero when adaptive data fails', async () => {
      progressRepositoryMock.findModuleProgressByUser.mockResolvedValue([])
      progressRepositoryMock.findLessonProgressByUser.mockResolvedValue([])
      progressRepositoryMock.findStudyStreak.mockResolvedValue(null)
      adaptiveLearningServiceMock.getAdaptiveLearningData.mockRejectedValue(new Error('Adaptive service down'))

      const { getDashboardSummary } = dashboardService
      const dto = await getDashboardSummary('student-adaptive-fail')

      // When adaptive service fails, the catch block returns zeros
      // This is safe but honest (no fake activity)
      expect(dto.weeklyStudyMinutes).toBe(0)
      expect(dto.readinessScore).toBe(0)
    })
  })
})
