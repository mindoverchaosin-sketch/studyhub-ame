import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockProgressRepository, mockQuizRepository } from '../test-utils/repo-mocks'

describe('quiz.service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('getPublishedQuizzes maps repository results', async () => {
    const repo = mockQuizRepository({
      findAllPublished: vi.fn().mockResolvedValue([
        { id: 'q1', moduleId: 'm1', title: 'T', description: null, passingScore: 60, timeLimitMinutes: 0, status: 'PUBLISHED', publishedAt: null, createdAt: new Date(), updatedAt: new Date(), questionBanks: [] },
      ]),
    })

    const { getPublishedQuizzes } = await import('../../server/services/quiz.service')
    const res = await getPublishedQuizzes()
    expect(res.length).toBe(1)
    expect(repo.findAllPublished).toHaveBeenCalled()
  }, 15000)

  it('getQuizWithQuestions maps repository questions', async () => {
    const repo = mockQuizRepository({
      findWithQuestions: vi.fn().mockResolvedValue({
        id: 'q2', moduleId: 'm2', title: 'T2', description: null, passingScore: 50, timeLimitMinutes: 5, status: 'PUBLISHED', publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
        questionBanks: [{ id: 'b1', title: 'B', description: null, questions: [{ id: 'qq1', prompt: 'p', options: ['a'], correctOptionIndex: 0, explanation: null, difficulty: 'EASY', questionBankId: 'b1' }] }],
      }),
    })

    const { getQuizWithQuestions } = await import('../../server/services/quiz.service')
    const dto = await getQuizWithQuestions('q2')
    expect(dto?.questions?.length).toBe(1)
    expect(repo.findWithQuestions).toHaveBeenCalledWith('q2')
  })

  it('submitQuizAttempt returns review data and analytics payload', async () => {
    const quizRepo = mockQuizRepository({
      findWithQuestions: vi.fn().mockResolvedValue({
        id: 'q2', moduleId: 'm2', title: 'T2', description: null, passingScore: 70, timeLimitMinutes: 10, status: 'PUBLISHED', publishedAt: null, createdAt: new Date(), updatedAt: new Date(),
        questionBanks: [{ id: 'b1', title: 'B', description: null, questions: [
          { id: 'q1', prompt: 'Alpha', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'Because A is right', difficulty: 'BEGINNER', questionBankId: 'b1' },
          { id: 'q2', prompt: 'Beta', options: ['C', 'D'], correctOptionIndex: 1, explanation: 'Because D is right', difficulty: 'BEGINNER', questionBankId: 'b1' },
        ] }],
      }),
    })

    const progressRepo = mockProgressRepository({
      createQuizAttempt: vi.fn().mockResolvedValue({ id: 'attempt-1', score: 50, passed: false, attemptedAt: new Date(), quizId: 'q2', userId: 'u1' }),
      findQuizAttemptsByUser: vi.fn().mockResolvedValue([
        { id: 'attempt-1', score: 50, passed: false, attemptedAt: new Date(), quiz: { id: 'q2', title: 'T2', passingScore: 70 } },
        { id: 'attempt-2', score: 80, passed: true, attemptedAt: new Date(), quiz: { id: 'q2', title: 'T2', passingScore: 70 } },
      ]),
    })

    const { submitQuizAttempt, getQuizAnalytics } = await import('../../server/services/quiz.service')
    const result = await submitQuizAttempt({
      studentId: 'u1',
      quizId: 'q2',
      answers: { q1: 'A', q2: 'C' },
      startedAt: Date.now() - 60000,
      mode: 'practice',
      durationMinutes: 1,
      timedOut: false,
    })

    const analytics = await getQuizAnalytics('u1', 'q2')

    expect(result?.score).toBe(50)
    expect(result?.passed).toBe(false)
    expect(result?.accuracy).toBe(50)
    expect(result?.review).toHaveLength(2)
    expect(result?.review[0]?.isCorrect).toBe(true)
    expect(result?.review[1]?.isCorrect).toBe(false)
    expect(progressRepo.createQuizAttempt).toHaveBeenCalled()
    expect(analytics?.bestScore).toBe(80)
    expect(analytics?.averageScore).toBe(65)
    expect(analytics?.completionPercent).toBe(50)
    expect(analytics?.recentAttempts).toHaveLength(2)
    expect(quizRepo.findWithQuestions).toHaveBeenCalledWith('q2')
  })
})
