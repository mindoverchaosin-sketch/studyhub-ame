import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { questionRepositoryMock, questionBankRepositoryMock } = vi.hoisted(() => ({
  questionRepositoryMock: {
    findForAdmin: vi.fn(),
    countForAdmin: vi.fn(),
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
  },
  questionBankRepositoryMock: {
    findById: vi.fn(),
    findAll: vi.fn(),
  },
}))

vi.mock('@/server/repositories/question.repository', () => ({ questionRepository: questionRepositoryMock }))
vi.mock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository: questionBankRepositoryMock }))

describe('QuestionManagementService', () => {
  let service: InstanceType<typeof import('../../server/services/question-management.service').QuestionManagementService>

  beforeAll(async () => {
    const module = await import('../../server/services/question-management.service')
    service = new module.QuestionManagementService()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    questionRepositoryMock.findForAdmin.mockResolvedValue([])
    questionRepositoryMock.countForAdmin.mockResolvedValue(0)
    questionRepositoryMock.create.mockResolvedValue({
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
    })
    questionBankRepositoryMock.findById.mockResolvedValue({ id: 'bank-1', title: 'Airframes' })
    questionBankRepositoryMock.findAll.mockResolvedValue([{ id: 'bank-1', title: 'Airframes' }])
  })

  it('validates and creates questions using repository-backed persistence', async () => {
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
    expect(questionRepositoryMock.create).toHaveBeenCalled()
    expect(created.question?.question).toBe('What is hydraulics?')
  })

  it('filters and paginates question directories by admin criteria', async () => {
    questionRepositoryMock.findForAdmin.mockResolvedValue([
      { id: 'q1', prompt: 'What is hydraulics?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'It is the fluid system.', difficulty: 'BEGINNER', questionBankId: 'bank-1', status: 'PUBLISHED', metadata: { tags: ['hydraulics'], timeEstimateMinutes: 4 }, createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-02') },
    ])
    questionRepositoryMock.countForAdmin.mockResolvedValue(1)

    const result = await service.listQuestions({ search: 'hydraulics', status: 'PUBLISHED', difficulty: 'BEGINNER', page: 1, pageSize: 10 })

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(questionRepositoryMock.findForAdmin).toHaveBeenCalledWith(expect.objectContaining({ search: 'hydraulics', status: 'PUBLISHED', difficulty: 'BEGINNER' }))
  })

  it('returns not-found result for archiveQuestion when the question does not exist', async () => {
    questionRepositoryMock.findById.mockResolvedValue(null)

    const result = await service.archiveQuestion('ghost')

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([{ field: 'questionBankId', message: 'Question not found' }])
    expect(questionRepositoryMock.archive).not.toHaveBeenCalled()
  })

  it('returns not-found result for unarchiveQuestion when the question does not exist', async () => {
    questionRepositoryMock.findById.mockResolvedValue(null)

    const result = await service.unarchiveQuestion('ghost')

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([{ field: 'questionBankId', message: 'Question not found' }])
    expect(questionRepositoryMock.update).not.toHaveBeenCalled()
  })
})
