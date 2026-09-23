import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  findUnique: vi.fn(),
  canAccessQuestion: vi.fn(),
  upsertStudentQuestionState: vi.fn(),
}))

vi.mock('@/auth', () => ({ requireStudent: mocks.requireStudent }))
vi.mock('@/lib/prisma', () => ({ default: { question: { findUnique: mocks.findUnique } } }))
vi.mock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessQuestion: mocks.canAccessQuestion } }))
vi.mock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository: { upsertStudentQuestionState: mocks.upsertStudentQuestionState } }))

describe('student question state actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1' } })
    mocks.findUnique.mockResolvedValue({
      id: 'question-1', status: 'PUBLISHED', deletedAt: null, options: ['A', 'B'],
      questionBank: { status: 'PUBLISHED', deletedAt: null, isPremium: false },
    })
    mocks.canAccessQuestion.mockResolvedValue({ allowed: true })
    mocks.upsertStudentQuestionState.mockResolvedValue({ questionId: 'question-1', selectedOption: 1, answeredAt: new Date() })
  })

  it('requires an authenticated student and persists the student-owned answer', async () => {
    const { saveQuestionAnswer } = await import('@/server/actions/question-bank.actions')
    await saveQuestionAnswer('question-1', 1)

    expect(mocks.requireStudent).toHaveBeenCalledOnce()
    expect(mocks.upsertStudentQuestionState).toHaveBeenCalledWith('student-1', 'question-1', 1)
  })

  it('clears the current answer by persisting null values', async () => {
    const { saveQuestionAnswer } = await import('@/server/actions/question-bank.actions')
    await saveQuestionAnswer('question-1', null)

    expect(mocks.upsertStudentQuestionState).toHaveBeenCalledWith('student-1', 'question-1', null)
  })

  it('rejects inaccessible questions before persisting state', async () => {
    mocks.canAccessQuestion.mockResolvedValue({ allowed: false })
    const { saveQuestionAnswer } = await import('@/server/actions/question-bank.actions')

    await expect(saveQuestionAnswer('question-1', 0)).rejects.toThrow('Question access denied.')
    expect(mocks.upsertStudentQuestionState).not.toHaveBeenCalled()
  })

  it('rejects an option outside the question options', async () => {
    const { saveQuestionAnswer } = await import('@/server/actions/question-bank.actions')

    await expect(saveQuestionAnswer('question-1', 2)).rejects.toThrow('Invalid answer option.')
    expect(mocks.upsertStudentQuestionState).not.toHaveBeenCalled()
  })
})
