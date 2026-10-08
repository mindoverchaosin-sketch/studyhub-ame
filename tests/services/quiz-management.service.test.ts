import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  moduleFindById: vi.fn(),
  bankFindById: vi.fn(),
  quizCreate: vi.fn(),
  quizFindForAdminById: vi.fn(),
  quizUpdate: vi.fn(),
  transaction: vi.fn(),
  txModuleFindUnique: vi.fn(),
  txModuleUpdate: vi.fn(),
  txModuleUpdateMany: vi.fn(),
  txQuizFindFirst: vi.fn(),
  txQuizFindUnique: vi.fn(),
  txQuizUpdate: vi.fn(),
  txQuizAttemptUpdate: vi.fn(),
  txQuizAttemptUpdateMany: vi.fn(),
  txQuizAttemptDeleteMany: vi.fn(),
  txQuestionBankFindUnique: vi.fn(),
}))

const tx = {
  module: {
    findUnique: mocks.txModuleFindUnique,
    update: mocks.txModuleUpdate,
    updateMany: mocks.txModuleUpdateMany,
  },
  quiz: {
    findFirst: mocks.txQuizFindFirst,
    findUnique: mocks.txQuizFindUnique,
    update: mocks.txQuizUpdate,
  },
  quizAttempt: {
    update: mocks.txQuizAttemptUpdate,
    updateMany: mocks.txQuizAttemptUpdateMany,
    deleteMany: mocks.txQuizAttemptDeleteMany,
  },
  questionBank: { findUnique: mocks.txQuestionBankFindUnique },
}

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
    transaction: mocks.transaction,
  },
}))

describe('QuizManagementService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.transaction.mockImplementation((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
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
    mocks.txModuleFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      canonicalQuizId: null,
      deletedAt: null,
    }))
    mocks.txModuleUpdate.mockImplementation(async ({ where, data }: { where: { id: string }; data: { canonicalQuizId: string | null } }) => ({
      id: where.id,
      canonicalQuizId: data.canonicalQuizId,
    }))
    mocks.txModuleUpdateMany.mockResolvedValue({ count: 1 })
    mocks.txQuizFindFirst.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      questionBanks: [{ id: 'bank-1' }],
      _count: { attempts: 0 },
      status: 'PUBLISHED',
      deletedAt: null,
    })
    mocks.txQuizFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      moduleId: 'module-1',
      status: 'PUBLISHED',
      deletedAt: null,
    }))
    mocks.txQuizUpdate.mockResolvedValue({ id: 'quiz-1' })
    mocks.txQuestionBankFindUnique.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id, deletedAt: null }))
  })

  it('does not expose a hard-delete operation, regardless of attempt count', async () => {
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    expect('delete' in service).toBe(false)
    expect(mocks.quizFindForAdminById).not.toHaveBeenCalled()
    expect(mocks.txQuizUpdate).not.toHaveBeenCalled()
  })

  it('prevents changing module or QuestionBank associations after attempts exist', async () => {
    mocks.txQuizFindFirst.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      questionBanks: [{ id: 'bank-1' }],
      _count: { attempts: 2 },
      status: 'PUBLISHED',
      deletedAt: null,
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
    expect(mocks.txQuizUpdate).not.toHaveBeenCalled()
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

    expect(mocks.txQuizUpdate).toHaveBeenCalledOnce()
  })

  it('designates a same-module published quiz without modifying quizzes or attempts', async () => {
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await expect(service.setCanonicalQuiz('module-1', 'quiz-1')).resolves.toEqual({
      id: 'module-1',
      previousCanonicalQuizId: null,
      canonicalQuizId: 'quiz-1',
    })
    expect(mocks.txQuizFindUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'quiz-1' },
    }))
    expect(mocks.txModuleUpdate).toHaveBeenCalledWith({
      where: { id: 'module-1' },
      data: { canonicalQuizId: 'quiz-1' },
    })
    expect(mocks.txQuizUpdate).not.toHaveBeenCalled()
    expect(mocks.txQuizAttemptUpdate).not.toHaveBeenCalled()
    expect(mocks.txQuizAttemptUpdateMany).not.toHaveBeenCalled()
    expect(mocks.txQuizAttemptDeleteMany).not.toHaveBeenCalled()
  })

  it('changes the canonical pointer without changing the old quiz or attempts', async () => {
    mocks.txModuleFindUnique.mockResolvedValue({
      id: 'module-1',
      canonicalQuizId: 'old-quiz',
      deletedAt: null,
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await expect(service.setCanonicalQuiz('module-1', 'quiz-1')).resolves.toEqual({
      id: 'module-1',
      previousCanonicalQuizId: 'old-quiz',
      canonicalQuizId: 'quiz-1',
    })
    expect(mocks.txModuleUpdate).toHaveBeenCalledWith({
      where: { id: 'module-1' },
      data: { canonicalQuizId: 'quiz-1' },
    })
    expect(mocks.txQuizUpdate).not.toHaveBeenCalled()
  })

  it('rejects a quiz owned by a different module without changing the module', async () => {
    mocks.txQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-2',
      status: 'PUBLISHED',
      deletedAt: null,
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await expect(service.setCanonicalQuiz('module-1', 'quiz-1')).rejects.toThrow('must belong to this module')
    expect(mocks.txModuleUpdate).not.toHaveBeenCalled()
  })

  it.each(['DRAFT', 'ARCHIVED'] as const)('rejects a %s quiz as canonical', async (status) => {
    mocks.txQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      status,
      deletedAt: null,
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await expect(service.setCanonicalQuiz('module-1', 'quiz-1')).rejects.toThrow('Only a published, available quiz')
    expect(mocks.txModuleUpdate).not.toHaveBeenCalled()
  })

  it('rejects a deleted quiz as canonical', async () => {
    mocks.txQuizFindUnique.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      status: 'PUBLISHED',
      deletedAt: new Date(),
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await expect(service.setCanonicalQuiz('module-1', 'quiz-1')).rejects.toThrow('Only a published, available quiz')
    expect(mocks.txModuleUpdate).not.toHaveBeenCalled()
  })

  it('clears the canonical pointer without modifying the quiz', async () => {
    mocks.txModuleFindUnique.mockResolvedValue({ id: 'module-1', canonicalQuizId: 'quiz-1', deletedAt: null })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await expect(service.setCanonicalQuiz('module-1', null)).resolves.toMatchObject({
      previousCanonicalQuizId: 'quiz-1',
      canonicalQuizId: null,
    })
    expect(mocks.txQuizFindUnique).not.toHaveBeenCalled()
    expect(mocks.txQuizUpdate).not.toHaveBeenCalled()
    expect(mocks.txModuleUpdate).toHaveBeenCalledWith({
      where: { id: 'module-1' },
      data: { canonicalQuizId: null },
    })
    expect(mocks.txQuizUpdate).not.toHaveBeenCalled()
    expect(mocks.txQuizAttemptUpdate).not.toHaveBeenCalled()
    expect(mocks.txQuizAttemptUpdateMany).not.toHaveBeenCalled()
    expect(mocks.txQuizAttemptDeleteMany).not.toHaveBeenCalled()
  })

  it('clears a canonical pointer atomically when a quiz is unpublished or archived', async () => {
    mocks.txQuizFindFirst.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      status: 'PUBLISHED',
      deletedAt: null,
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await service.setStatus('quiz-1', 'DRAFT')
    await service.setStatus('quiz-1', 'ARCHIVED')

    expect(mocks.txModuleUpdateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'module-1', canonicalQuizId: 'quiz-1' },
      data: { canonicalQuizId: null },
    })
    expect(mocks.txModuleUpdateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'module-1', canonicalQuizId: 'quiz-1' },
      data: { canonicalQuizId: null },
    })
  })

  it('clears the old canonical pointer when moving a quiz without designating the destination', async () => {
    mocks.txQuizFindFirst.mockResolvedValue({
      id: 'quiz-1',
      moduleId: 'module-1',
      questionBanks: [{ id: 'bank-1' }],
      _count: { attempts: 0 },
      status: 'PUBLISHED',
      deletedAt: null,
    })
    const { QuizManagementService } = await import('@/server/services/quiz-management.service')
    const service = new QuizManagementService()

    await service.update('quiz-1', {
      moduleId: 'module-2',
      title: 'Moved quiz',
      questionBankIds: ['bank-1'],
    })

    expect(mocks.txModuleUpdateMany).toHaveBeenCalledWith({
      where: { id: 'module-1', canonicalQuizId: 'quiz-1' },
      data: { canonicalQuizId: null },
    })
    expect(mocks.txModuleUpdate).not.toHaveBeenCalled()
    expect(mocks.txQuizUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'quiz-1' },
      data: expect.objectContaining({ module: { connect: { id: 'module-2' } } }),
    }))
  })
})
