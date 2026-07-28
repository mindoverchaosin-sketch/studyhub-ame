import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('QuestionManagementService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('validates and creates questions using repository-backed persistence', async () => {
    const questionRepository = {
      findForAdmin: vi.fn().mockResolvedValue([]),
      countForAdmin: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({
        id: 'q1',
        prompt: 'What is hydraulics?',
        options: ['A', 'B'],
        correctOptionIndex: 0,
        explanation: 'It is the fluid system.',
        difficulty: 'BEGINNER',
        questionBankId: 'bank-1',
        status: 'DRAFT',
        metadata: { tags: ['hydraulics'], timeEstimateMinutes: 3 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      }),
      update: vi.fn(),
      archive: vi.fn(),
      unarchive: vi.fn(),
      findById: vi.fn(),
      countAll: vi.fn(),
      findByBank: vi.fn(),
      findByTopic: vi.fn(),
      findManyByIds: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    }

    const questionBankRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'bank-1', title: 'Airframes' }),
      findAll: vi.fn(),
    }

    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository }))
    vi.doMock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository }))

    const { QuestionManagementService } = await import('../../server/services/question-management.service')
    const service = new QuestionManagementService()

    const validationResult = await service.createQuestion({
      prompt: '',
      options: [''],
      correctOptionIndex: null,
      questionBankId: 'bank-1',
      difficulty: 'BEGINNER',
    })

    expect(validationResult.success).toBe(false)
    expect(validationResult.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'prompt' }),
      expect.objectContaining({ field: 'options' }),
      expect.objectContaining({ field: 'correctOptionIndex' }),
    ]))

    const created = await service.createQuestion({
      prompt: 'What is hydraulics?',
      options: ['A', 'B'],
      correctOptionIndex: 0,
      questionBankId: 'bank-1',
      difficulty: 'BEGINNER',
    })

    expect(created.success).toBe(true)
    expect(questionRepository.create).toHaveBeenCalled()
    expect(created.question?.question).toBe('What is hydraulics?')
  })

  it('filters and paginates question directories by admin criteria', async () => {
    const questionRepository = {
      findForAdmin: vi.fn().mockResolvedValue([
        { id: 'q1', prompt: 'What is hydraulics?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'It is the fluid system.', difficulty: 'BEGINNER', questionBankId: 'bank-1', status: 'PUBLISHED', metadata: { tags: ['hydraulics'], timeEstimateMinutes: 4 }, createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-02') },
      ]),
      countForAdmin: vi.fn().mockResolvedValue(1),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      unarchive: vi.fn(),
      findById: vi.fn(),
      countAll: vi.fn(),
      findByBank: vi.fn(),
      findByTopic: vi.fn(),
      findManyByIds: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    }

    const questionBankRepository = {
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue([{ id: 'bank-1', title: 'Airframes' }]),
    }

    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository }))
    vi.doMock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository }))

    const { QuestionManagementService } = await import('../../server/services/question-management.service')
    const service = new QuestionManagementService()

    const result = await service.listQuestions({ search: 'hydraulics', status: 'PUBLISHED', difficulty: 'BEGINNER', page: 1, pageSize: 10 })

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(questionRepository.findForAdmin).toHaveBeenCalledWith(expect.objectContaining({ search: 'hydraulics', status: 'PUBLISHED', difficulty: 'BEGINNER' }))
  })
})
