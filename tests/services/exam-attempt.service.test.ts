import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/repositories/exam-template.repository', () => ({
  examTemplateRepository: {
    getTemplate: vi.fn().mockResolvedValue({ id: 'tpl1', questionBankId: 'bank1', durationMinutes: 30, questionCount: 2, shuffleQuestions: true }),
  },
}))

vi.mock('@/server/repositories/exam-attempt.repository', () => ({
  examAttemptRepository: {
    createAttemptWithQuestions: vi.fn().mockImplementation(async (a, q) => ({ id: 'attempt1', ...a, createdAt: new Date(), updatedAt: new Date() })),
    getAttemptQuestions: vi.fn().mockImplementation(async (attemptId: string) => {
      return [{ id: 'aq1', questionId: 'q1', displayOrder: 1 }, { id: 'aq2', questionId: 'q2', displayOrder: 2 }]
    }),
    loadAttemptWithRelations: vi.fn().mockImplementation(async (attemptId: string) => ({ id: 'attempt1', passingPercentage: 60, examAttemptQuestion: [{ id: 'aq1', questionId: 'q1', displayOrder: 1 }, { id: 'aq2', questionId: 'q2', displayOrder: 2 }], examAttemptAnswer: [] })),
  },
}))

vi.mock('@/server/repositories/question.repository', () => ({
  questionRepository: {
    findByBank: vi.fn().mockResolvedValue([{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]),
    findAdmin: vi.fn().mockResolvedValue([{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]),
  },
}))

import { generateExamAttempt } from '@/server/services/exam-attempt.service'

describe('exam-attempt.service', () => {
  it('generates an attempt and selects questions', async () => {
    const attempt = await generateExamAttempt('tpl1', 'student1')
    expect(attempt.id).toBeDefined()
    expect(attempt.questions).toBeDefined()
    expect(attempt.questions!.length).toBeGreaterThan(0)
  })
})
