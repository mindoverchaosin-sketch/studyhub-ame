import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  moduleFindById: vi.fn(),
  bankFindById: vi.fn(),
  quizCreate: vi.fn(),
  quizFindForAdminById: vi.fn(),
  quizUpdate: vi.fn(),
}))

vi.mock('@/server/repositories/module.repository', () => ({
  moduleRepository: { findById: mocks.moduleFindById },
}))
vi.mock('@/server/repositories/question-bank.repository', () => ({
  questionBankRepository: { findById: mocks.bankFindById },
}))
vi.mock('@/server/repositories/quiz.repository', () => ({
  quizRepository: {
    create: mocks.quizCreate,
    findForAdminById: mocks.quizFindForAdminById,
    update: mocks.quizUpdate,
  },
}))

describe('QuizManagementService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.moduleFindById.mockImplementation(async (id: string) => ({ id, deletedAt: null }))
    mocks.bankFindById.mockImplementation(async (id: string) => ({ id, deletedAt: null }))
    mocks.quizCreate.mockImplementation(async (input: unknown) => ({ id: 'quiz-created', input }))
    mocks.quizFindForAdminById.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      questionBanks: [{ id: 'bank-1' }],
      _count: { attempts: 0 },
    })
    mocks.quizUpdate.mockResolvedValue({ id: 'quiz-1' })
  })

  it('does not expose a hard-delete operation, regardless of attempt count', async () => {
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    expect('delete' in service).toBe(false)
    expect(mocks.quizFindForAdminById).not.toHaveBeenCalled()
    expect(mocks.quizUpdate).not.toHaveBeenCalled()
  })

  it('prevents changing module or QuestionBank associations after attempts exist', async () => {
    mocks.quizFindForAdminById.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      questionBanks: [{ id: 'bank-1' }],
      _count: { attempts: 2 },
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await expect(service.update('quiz-1', {
      moduleId: 'module-2',
      title: 'Moved quiz',
      questionBankIds: ['bank-1'],
    })).rejects.toThrow('cannot be moved or have its question banks changed')

    await expect(service.update('quiz-1', {
      moduleId: 'module-1',
      title: 'Changed banks',
      questionBankIds: ['bank-2'],
    })).rejects.toThrow('cannot be moved or have its question banks changed')
    expect(mocks.quizUpdate).not.toHaveBeenCalled()
  })

  it('allows reuse of the same QuestionBank by quizzes in different Modules', async () => {
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await service.create({ moduleId: 'module-1', title: 'Quiz one', questionBankIds: ['bank-shared'] })
    await service.create({ moduleId: 'module-2', title: 'Quiz two', questionBankIds: ['bank-shared'] })

    expect(mocks.quizCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({
      module: { connect: { id: 'module-1' } },
      questionBanks: { connect: [{ id: 'bank-shared' }] },
    }))
    expect(mocks.quizCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({
      module: { connect: { id: 'module-2' } },
      questionBanks: { connect: [{ id: 'bank-shared' }] },
    }))
    expect(mocks.bankFindById).toHaveBeenCalledTimes(2)
    expect(mocks.moduleFindById).toHaveBeenNthCalledWith(1, 'module-1')
    expect(mocks.moduleFindById).toHaveBeenNthCalledWith(2, 'module-2')
  })

  it('allows ordinary updates for a Quiz with attempts when ownership and banks are unchanged', async () => {
    mocks.quizFindForAdminById.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      questionBanks: [{ id: 'bank-1' }],
      _count: { attempts: 1 },
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await service.update('quiz-1', {
      moduleId: 'module-1',
      title: 'Updated title',
      questionBankIds: ['bank-1'],
    })

    expect(mocks.quizUpdate).toHaveBeenCalledOnce()
  })
})
