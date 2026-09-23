import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { quizRepositoryMock, lessonRepositoryMock, progressRepositoryMock, upsertLessonProgressMock } = vi.hoisted(() => ({
  quizRepositoryMock: {
    findAllPublished: vi.fn(),
    findWithQuestions: vi.fn(),
    findPublishedWithQuestions: vi.fn(),
    findById: vi.fn(),
    findByLesson: vi.fn(),
    countAll: vi.fn(),
  },
  lessonRepositoryMock: {
    findById: vi.fn(),
  },
  progressRepositoryMock: {
    createQuizAttempt: vi.fn(),
    findQuizAttemptsByUser: vi.fn(),
    upsertLessonProgress: vi.fn(),
  },
  upsertLessonProgressMock: vi.fn(),
}))

vi.mock('@/server/repositories/quiz.repository', () => ({ quizRepository: quizRepositoryMock }))
vi.mock('@/server/repositories/lesson.repository', () => ({ lessonRepository: lessonRepositoryMock }))
vi.mock('@/server/repositories/progress.repository', () => ({ progressRepository: progressRepositoryMock }))
vi.mock('@/server/application/mappers/quiz.mapper', () => ({
  mapQuizEntityToDTO: (quiz: any) => ({ id: quiz.id, title: quiz.title, moduleId: quiz.moduleId, passingScore: quiz.passingScore, questions: [] }),
  mapQuizWithQuestionsEntityToDTO: (quiz: any) => ({ id: quiz.id, title: quiz.title, moduleId: quiz.moduleId, passingScore: quiz.passingScore, questions: quiz.questionBanks?.flatMap((bank: any) => bank.questions ?? []).map((question: any) => ({ id: question.id, prompt: question.prompt })) ?? [] }),
}))
vi.mock('@/server/services/cache', () => ({ invalidateServiceCache: vi.fn() }))
vi.mock('@/server/services/progress.service', () => ({ upsertLessonProgress: upsertLessonProgressMock }))

describe('quiz.service', () => {
  let quizService: typeof import('../../server/services/quiz.service')

  beforeAll(async () => {
    quizService = await import('../../server/services/quiz.service')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    quizRepositoryMock.findAllPublished.mockResolvedValue([])
    quizRepositoryMock.findWithQuestions.mockResolvedValue(null)
    quizRepositoryMock.findPublishedWithQuestions.mockResolvedValue(null)
    quizRepositoryMock.findById.mockResolvedValue(null)
    quizRepositoryMock.findByLesson.mockResolvedValue(null)
    quizRepositoryMock.countAll.mockResolvedValue(0)
    progressRepositoryMock.createQuizAttempt.mockResolvedValue(null)
    progressRepositoryMock.findQuizAttemptsByUser.mockResolvedValue([])
    progressRepositoryMock.upsertLessonProgress.mockResolvedValue(null)
    upsertLessonProgressMock.mockResolvedValue(null)
    lessonRepositoryMock.findById.mockResolvedValue(null)
  })

  it('getPublishedQuizzes maps repository results', async () => {
    quizRepositoryMock.findAllPublished.mockResolvedValue([
      { id: 'q1', moduleId: 'm1', title: 'T', description: null, passingScore: 60, timeLimitMinutes: 0, status: 'PUBLISHED', publishedAt: null, createdAt: new Date(), updatedAt: new Date(), questionBanks: [] },
    ])

    const res = await quizService.getPublishedQuizzes()
    expect(res.length).toBe(1)
    expect(quizRepositoryMock.findAllPublished).toHaveBeenCalled()
  })

  it('getQuizWithQuestions maps repository questions', async () => {
    quizRepositoryMock.findPublishedWithQuestions.mockResolvedValue({
      id: 'q2', moduleId: 'm2', title: 'T2', description: null, passingScore: 50, timeLimitMinutes: 5, status: 'PUBLISHED', publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
      questionBanks: [{ id: 'b1', title: 'B', description: null, questions: [{ id: 'qq1', prompt: 'p', options: ['a'], correctOptionIndex: 0, explanation: null, difficulty: 'EASY', questionBankId: 'b1' }] }],
    })

    const dto = await quizService.getQuizWithQuestions('q2')
    expect(dto?.questions?.length).toBe(1)
    expect(quizRepositoryMock.findPublishedWithQuestions).toHaveBeenCalledWith('q2')
  })

  it('submitQuizAttempt returns review data and analytics payload', async () => {
    quizRepositoryMock.findPublishedWithQuestions.mockResolvedValue({
      id: 'q2', moduleId: 'm2', title: 'T2', description: null, passingScore: 70, timeLimitMinutes: 10, status: 'PUBLISHED', publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
      questionBanks: [{ id: 'b1', title: 'B', description: null, questions: [
        { id: 'q1', prompt: 'Alpha', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'Because A is right', difficulty: 'BEGINNER', questionBankId: 'b1' },
        { id: 'q2', prompt: 'Beta', options: ['C', 'D'], correctOptionIndex: 1, explanation: 'Because D is right', difficulty: 'BEGINNER', questionBankId: 'b1' },
      ] }],
    })

    progressRepositoryMock.createQuizAttempt.mockResolvedValue({ id: 'attempt-1', score: 50, passed: false, attemptedAt: new Date(), quizId: 'q2', userId: 'u1' })
    progressRepositoryMock.findQuizAttemptsByUser.mockResolvedValue([
      { id: 'attempt-1', score: 50, passed: false, attemptedAt: new Date(), quiz: { id: 'q2', title: 'T2', passingScore: 70 } },
      { id: 'attempt-2', score: 80, passed: true, attemptedAt: new Date(), quiz: { id: 'q2', title: 'T2', passingScore: 70 } },
    ])

    const result = await quizService.submitQuizAttempt({
      studentId: 'u1',
      quizId: 'q2',
      answers: { q1: 'A', q2: 'C' },
      startedAt: Date.now() - 60000,
      mode: 'practice',
      durationMinutes: 1,
      timedOut: false,
    })

    const analytics = await quizService.getQuizAnalytics('u1', 'q2')

    expect(result?.score).toBe(50)
    expect(result?.passed).toBe(false)
    expect(result?.accuracy).toBe(50)
    expect(result?.review).toHaveLength(2)
    expect(result?.review[0]?.isCorrect).toBe(true)
    expect(result?.review[1]?.isCorrect).toBe(false)
    expect(progressRepositoryMock.createQuizAttempt).toHaveBeenCalled()
    expect(upsertLessonProgressMock).not.toHaveBeenCalled()
    expect(analytics?.bestScore).toBe(80)
    expect(analytics?.averageScore).toBe(65)
    expect(analytics?.completionPercent).toBe(50)
    expect(analytics?.recentAttempts).toHaveLength(2)
    expect(quizRepositoryMock.findPublishedWithQuestions).toHaveBeenCalledWith('q2')
  })

  it('updates progress only when an explicit published lesson belongs to the quiz module', async () => {
    quizRepositoryMock.findPublishedWithQuestions.mockResolvedValue({
      id: 'q3', moduleId: 'm3', title: 'T3', description: null, passingScore: 70, timeLimitMinutes: 0, status: 'PUBLISHED',
      questionBanks: [{ questions: [{ id: 'q3-1', prompt: 'Alpha', options: ['A'], correctOptionIndex: 0, explanation: null }] }],
    })
    lessonRepositoryMock.findById.mockResolvedValue({ id: 'lesson-3', moduleId: 'm3', status: 'PUBLISHED', deletedAt: null })
    progressRepositoryMock.findQuizAttemptsByUser.mockResolvedValue([])

    await quizService.submitQuizAttempt({
      studentId: 'u1', quizId: 'q3', lessonId: 'lesson-3', answers: { 'q3-1': 'A' }, startedAt: Date.now() - 1000,
      mode: 'practice', durationMinutes: 1, timedOut: false,
    })

    expect(upsertLessonProgressMock).toHaveBeenCalledWith('u1', 'lesson-3', expect.objectContaining({ percentComplete: 100 }))
    expect(progressRepositoryMock.createQuizAttempt).toHaveBeenCalled()
  })
})
