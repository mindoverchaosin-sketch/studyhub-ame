import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockQuizRepository } from '../test-utils/repo-mocks'

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
  })

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
})
