import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findPublishedWithQuestions: vi.fn(),
  findById: vi.fn(),
  questionFindById: vi.fn(),
  canAccessQuestionBank: vi.fn(),
  canAccessQuestion: vi.fn(),
}))

vi.mock('@/server/repositories/question-bank.repository', () => ({
  questionBankRepository: {
    findPublishedWithQuestions: mocks.findPublishedWithQuestions,
    findById: mocks.findById,
  },
}))

vi.mock('@/server/repositories/question.repository', () => ({
  questionRepository: { findById: mocks.questionFindById },
}))

vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: {
    canAccessQuestionBank: mocks.canAccessQuestionBank,
    canAccessQuestion: mocks.canAccessQuestion,
  },
}))

describe('student question bank service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.findPublishedWithQuestions.mockResolvedValue([])
    mocks.canAccessQuestionBank.mockResolvedValue({ allowed: true })
    mocks.canAccessQuestion.mockResolvedValue({ allowed: true })
  })

  it('loads a persisted free question bank and its published questions', async () => {
    mocks.findPublishedWithQuestions.mockResolvedValue([{
      id: 'free-bank', title: 'Free Bank', description: 'Basics', status: 'PUBLISHED', isPremium: false,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'), deletedAt: null,
      questions: [{ id: 'q1', questionBankId: 'free-bank', prompt: 'What is lift?', options: ['A', 'B'], correctOptionIndex: 0, explanation: null, difficulty: 'BEGINNER', status: 'PUBLISHED', deletedAt: null }],
    }])

    const { getStudentQuestionBanks } = await import('@/server/services/student-question-bank.service')
    const result = await getStudentQuestionBanks('student-1')

    expect(result[0]).toMatchObject({ id: 'free-bank', isPremium: false, questionCount: 1, locked: false })
    expect(result[0].questions).toHaveLength(1)
    expect(mocks.canAccessQuestionBank).toHaveBeenCalledWith('student-1', false)
  })

  it('denies a premium bank to a student without entitlement while retaining metadata', async () => {
    mocks.findPublishedWithQuestions.mockResolvedValue([{
      id: 'premium-bank', title: 'Premium Bank', description: null, status: 'PUBLISHED', isPremium: true,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null, questions: [{ id: 'q1', questionBankId: 'premium-bank', prompt: 'Hidden', options: [], correctOptionIndex: null, explanation: null, difficulty: 'BEGINNER', status: 'PUBLISHED', deletedAt: null }],
    }])
    mocks.canAccessQuestionBank.mockResolvedValue({ allowed: false, requiredFeature: 'premiumModules' })

    const { getStudentQuestionBanks } = await import('@/server/services/student-question-bank.service')
    const result = await getStudentQuestionBanks('free-student')

    expect(result[0]).toMatchObject({ isPremium: true, locked: true, questionCount: 1 })
    expect(result[0].questions).toHaveLength(0)
  })

  it('allows a premium bank and its questions for an entitled student', async () => {
    mocks.findPublishedWithQuestions.mockResolvedValue([{
      id: 'premium-bank', title: 'Premium Bank', description: null, status: 'PUBLISHED', isPremium: true,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null, questions: [{ id: 'q1', questionBankId: 'premium-bank', prompt: 'Visible', options: [], correctOptionIndex: null, explanation: null, difficulty: 'BEGINNER', status: 'PUBLISHED', deletedAt: null }],
    }])

    const { getStudentQuestionBanks } = await import('@/server/services/student-question-bank.service')
    const result = await getStudentQuestionBanks('premium-student')

    expect(result[0]).toMatchObject({ isPremium: true, locked: false })
    expect(result[0].questions).toHaveLength(1)
  })

  it('relies on the repository published filter so archived banks are not listed', async () => {
    const { getStudentQuestionBanks } = await import('@/server/services/student-question-bank.service')
    await getStudentQuestionBanks('student-1')
    expect(mocks.findPublishedWithQuestions).toHaveBeenCalledWith(undefined)
  })

  it('denies direct question access through the parent premium bank', async () => {
    mocks.questionFindById.mockResolvedValue({ id: 'q1', questionBankId: 'premium-bank', prompt: 'Hidden', options: [], correctOptionIndex: null, explanation: null, difficulty: 'BEGINNER', status: 'PUBLISHED' })
    mocks.findById.mockResolvedValue({ id: 'premium-bank', status: 'PUBLISHED', isPremium: true, deletedAt: null })
    mocks.canAccessQuestion.mockResolvedValue({ allowed: false, requiredFeature: 'premiumModules' })

    const { getStudentQuestion } = await import('@/server/services/student-question-bank.service')
    await expect(getStudentQuestion('free-student', 'q1')).resolves.toBeNull()
    expect(mocks.canAccessQuestion).toHaveBeenCalledWith('free-student', true)
  })

  it('allows direct question access for a free parent bank', async () => {
    mocks.questionFindById.mockResolvedValue({ id: 'q1', questionBankId: 'free-bank', prompt: 'Visible', options: [], correctOptionIndex: null, explanation: null, difficulty: 'BEGINNER', status: 'PUBLISHED' })
    mocks.findById.mockResolvedValue({ id: 'free-bank', status: 'PUBLISHED', isPremium: false, deletedAt: null })

    const { getStudentQuestion } = await import('@/server/services/student-question-bank.service')
    await expect(getStudentQuestion('student-1', 'q1')).resolves.toMatchObject({ id: 'q1', questionBankId: 'free-bank' })
  })
})