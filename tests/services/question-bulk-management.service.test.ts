import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('question bulk services', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns a summary for bulk archive and restore operations', async () => {
    const questionRepository = {
      findManyByIds: vi.fn().mockResolvedValue([
        { id: 'q1', prompt: 'Question 1', status: 'DRAFT' },
        { id: 'q2', prompt: 'Question 2', status: 'DRAFT' },
      ]),
      update: vi.fn().mockImplementation(async (_id: string, data: any) => ({ id: _id, ...data })),
      archive: vi.fn().mockResolvedValue({ id: 'q1', status: 'ARCHIVED' }),
      restore: vi.fn().mockResolvedValue({ id: 'q2', status: 'DRAFT' }),
      createManyInTransaction: vi.fn(),
      findById: vi.fn(),
      findForAdmin: vi.fn(),
      countForAdmin: vi.fn(),
      create: vi.fn(),
      countAll: vi.fn(),
      findByBank: vi.fn(),
      findByTopic: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    }

    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository }))
    vi.doMock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository: { findById: vi.fn(), findAll: vi.fn() } }))

    const { BulkQuestionManagementService } = await import('../../server/services/bulk-question-management.service')
    const service = new BulkQuestionManagementService()

    const archiveResult = await service.archiveQuestions(['q1', 'q2'])
    expect(archiveResult.summary.successCount).toBe(2)
    expect(archiveResult.summary.failureCount).toBe(0)

    const restoreResult = await service.restoreQuestions(['q1', 'q2'])
    expect(restoreResult.summary.successCount).toBe(2)
  })

  it('rejects invalid imports and rolls back without creating rows', async () => {
    const questionRepository = {
      findManyByIds: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
      createManyInTransaction: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findForAdmin: vi.fn(),
      countForAdmin: vi.fn(),
      create: vi.fn(),
      countAll: vi.fn(),
      findByBank: vi.fn().mockResolvedValue([]),
      findByTopic: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    }

    const questionBankRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'bank-1', title: 'Airframes' }),
      findAll: vi.fn(),
    }

    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository }))
    vi.doMock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository }))

    const { QuestionImportService } = await import('../../server/services/question-import.service')
    const service = new QuestionImportService()

    const result = await service.importQuestions({
      questionBankId: 'bank-1',
      content: 'question,options,correct_answer,explanation,difficulty,module\nWhat is hydraulics?,A|B,missing,Example,BEGINNER,Airframes\n',
    })

    expect(result.summary.successCount).toBe(0)
    expect(result.summary.failureCount).toBe(1)
    expect(result.summary.validationErrors).toEqual(expect.arrayContaining([expect.stringContaining('correct answer')]))
    expect(questionRepository.createManyInTransaction).not.toHaveBeenCalled()
  })

  it('exports filtered questions to csv', async () => {
    const questionRepository = {
      findManyByIds: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
      createManyInTransaction: vi.fn(),
      findById: vi.fn(),
      findForAdmin: vi.fn().mockResolvedValue([
        {
          id: 'q1',
          prompt: 'What is hydraulics?',
          options: ['A', 'B'],
          correctOptionIndex: 0,
          explanation: 'Fluid system',
          difficulty: 'BEGINNER',
          questionBankId: 'bank-1',
          status: 'DRAFT',
          metadata: { tags: ['hydraulics'], timeEstimateMinutes: 3 },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ]),
      countForAdmin: vi.fn(),
      create: vi.fn(),
      countAll: vi.fn(),
      findByBank: vi.fn(),
      findByTopic: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    }

    const questionBankRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'bank-1', title: 'Airframes' }),
      findAll: vi.fn(),
    }

    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository }))
    vi.doMock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository }))

    const { QuestionExportService } = await import('../../server/services/question-export.service')
    const service = new QuestionExportService()

    const csv = await service.exportQuestions({ search: 'hydraulics' })

    expect(csv).toContain('question,options,correct_answer,explanation,module,difficulty,status')
    expect(csv).toContain('What is hydraulics?')
  })
})
