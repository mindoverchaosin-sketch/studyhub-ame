import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { questionBankRepositoryMock } = vi.hoisted(() => ({
  questionBankRepositoryMock: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByIdWithCount: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    publish: vi.fn(),
    findForAdmin: vi.fn(),
    countForAdmin: vi.fn(),
  },
}))

vi.mock('@/server/repositories/question-bank.repository', () => ({
  questionBankRepository: questionBankRepositoryMock,
}))

describe('QuestionBankManagementService', () => {
  let service: InstanceType<typeof import('../../server/services/question-bank-management.service').QuestionBankManagementService>

  beforeAll(async () => {
    const module = await import('../../server/services/question-bank-management.service')
    service = new module.QuestionBankManagementService()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createQuestionBank', () => {
    it('should validate and create question bank with valid input', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Hydraulics',
        description: 'Hydraulic systems questions',
        status: 'DRAFT',
        isPremium: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.create.mockResolvedValue({
        id: 'qb-1',
        title: 'Hydraulics',
        description: 'Hydraulic systems questions',
        status: 'DRAFT',
        isPremium: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      })

      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.createQuestionBank({
        title: 'Hydraulics',
        description: 'Hydraulic systems questions',
      })

      expect(result.success).toBe(true)
      expect(result.questionBank?.title).toBe('Hydraulics')
      expect(result.questionBank?.isPremium).toBe(false)
      expect(questionBankRepositoryMock.create).toHaveBeenCalledWith({
        title: 'Hydraulics',
        description: 'Hydraulic systems questions',
        isPremium: false,
      })
    })

    it('should fail validation if title is empty', async () => {
      const result = await service.createQuestionBank({
        title: '',
        description: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'title' }))
    })

    it('should fail validation if title is only whitespace', async () => {
      const result = await service.createQuestionBank({
        title: '   ',
        description: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'title' }))
    })

    it('should set default isPremium to false', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Test',
        description: null,
        status: 'DRAFT',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.create.mockResolvedValue({ id: 'qb-1', title: 'Test' })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.createQuestionBank({ title: 'Test' })

      expect(result.questionBank?.isPremium).toBe(false)
    })

    it('should set isPremium to true if provided', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Premium Bank',
        description: null,
        status: 'DRAFT',
        isPremium: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.create.mockResolvedValue({ id: 'qb-1', title: 'Premium Bank', isPremium: true })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.createQuestionBank({
        title: 'Premium Bank',
        isPremium: true,
      })

      expect(result.questionBank?.isPremium).toBe(true)
      expect(questionBankRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ isPremium: true })
      )
    })

    it('should include question count in response', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Test',
        description: null,
        status: 'DRAFT',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }],
        questionCount: 3,
      }

      questionBankRepositoryMock.create.mockResolvedValue({ id: 'qb-1', title: 'Test' })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.createQuestionBank({ title: 'Test' })

      expect(result.questionBank?.questionCount).toBe(3)
    })
  })

  describe('updateQuestionBank', () => {
    it('should update title', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Updated Title',
        description: 'Original description',
        status: 'DRAFT',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.update.mockResolvedValue({ id: 'qb-1', title: 'Updated Title' })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.updateQuestionBank('qb-1', {
        title: 'Updated Title',
      })

      expect(result.success).toBe(true)
      expect(result.questionBank?.title).toBe('Updated Title')
    })

    it('should set isPremium to true', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Test',
        description: null,
        status: 'DRAFT',
        isPremium: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.update.mockResolvedValue({ id: 'qb-1', isPremium: true })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.updateQuestionBank('qb-1', {
        isPremium: true,
      })

      expect(result.questionBank?.isPremium).toBe(true)
    })

    it('should change isPremium from true to false', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Test',
        description: null,
        status: 'DRAFT',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.update.mockResolvedValue({ id: 'qb-1', isPremium: false })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.updateQuestionBank('qb-1', {
        isPremium: false,
      })

      expect(result.questionBank?.isPremium).toBe(false)
    })

    it('should preserve existing isPremium if omitted', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Updated Title',
        description: null,
        status: 'DRAFT',
        isPremium: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.update.mockResolvedValue({ id: 'qb-1', title: 'Updated Title' })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.updateQuestionBank('qb-1', {
        title: 'Updated Title',
      })

      expect(result.questionBank?.isPremium).toBe(true)
      expect(questionBankRepositoryMock.update).toHaveBeenCalledWith('qb-1', {
        title: 'Updated Title',
      })
    })

    it('should fail validation if title is empty when provided', async () => {
      const result = await service.updateQuestionBank('qb-1', {
        title: '',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toContainEqual(expect.objectContaining({ field: 'title' }))
    })
  })

  describe('archiveQuestionBank', () => {
    it('should set status to ARCHIVED', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Test',
        description: null,
        status: 'ARCHIVED',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.archive.mockResolvedValue({ id: 'qb-1', status: 'ARCHIVED' })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.archiveQuestionBank('qb-1')

      expect(result.success).toBe(true)
      expect(result.questionBank?.status).toBe('ARCHIVED')
      expect(questionBankRepositoryMock.archive).toHaveBeenCalledWith('qb-1')
    })
  })

  describe('publishQuestionBank', () => {
    it('should set status to PUBLISHED', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Test',
        description: null,
        status: 'PUBLISHED',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [],
        questionCount: 0,
      }

      questionBankRepositoryMock.publish.mockResolvedValue({ id: 'qb-1', status: 'PUBLISHED' })
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.publishQuestionBank('qb-1')

      expect(result.success).toBe(true)
      expect(result.questionBank?.status).toBe('PUBLISHED')
      expect(questionBankRepositoryMock.publish).toHaveBeenCalledWith('qb-1')
    })
  })

  describe('listQuestionBanks', () => {
    it('should filter by search term', async () => {
      const mockQBs: any[] = [
        {
          id: 'qb-1',
          title: 'Hydraulics',
          description: null,
          status: 'DRAFT',
          isPremium: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          questionCount: 0,
        },
      ]

      questionBankRepositoryMock.findForAdmin.mockResolvedValue(mockQBs)
      questionBankRepositoryMock.countForAdmin.mockResolvedValue(1)

      const result = await service.listQuestionBanks({
        search: 'Hydraulics',
        page: 1,
        pageSize: 20,
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('Hydraulics')
      expect(questionBankRepositoryMock.findForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Hydraulics' })
      )
    })

    it('should filter by status', async () => {
      const mockQBs: any[] = [
        {
          id: 'qb-1',
          title: 'Test',
          description: null,
          status: 'PUBLISHED',
          isPremium: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          questionCount: 0,
        },
      ]

      questionBankRepositoryMock.findForAdmin.mockResolvedValue(mockQBs)
      questionBankRepositoryMock.countForAdmin.mockResolvedValue(1)

      const result = await service.listQuestionBanks({
        status: 'PUBLISHED',
      })

      expect(result.items[0].status).toBe('PUBLISHED')
      expect(questionBankRepositoryMock.findForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PUBLISHED' })
      )
    })

    it('should paginate results', async () => {
      const mockQBs: any[] = []

      questionBankRepositoryMock.findForAdmin.mockResolvedValue(mockQBs)
      questionBankRepositoryMock.countForAdmin.mockResolvedValue(50)

      const result = await service.listQuestionBanks({
        page: 2,
        pageSize: 20,
      })

      expect(result.page).toBe(2)
      expect(result.pageSize).toBe(20)
      expect(result.total).toBe(50)
      expect(questionBankRepositoryMock.findForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 })
      )
    })

    it('should sort by title ascending', async () => {
      const mockQBs: any[] = []

      questionBankRepositoryMock.findForAdmin.mockResolvedValue(mockQBs)
      questionBankRepositoryMock.countForAdmin.mockResolvedValue(0)

      const result = await service.listQuestionBanks({
        sortBy: 'title',
        sortOrder: 'asc',
      })

      expect(questionBankRepositoryMock.findForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'title', sortOrder: 'asc' })
      )
    })
  })

  describe('getQuestionBank', () => {
    it('should return question bank with count', async () => {
      const mockQB = {
        id: 'qb-1',
        title: 'Test',
        description: null,
        status: 'DRAFT',
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [{ id: 'q1' }, { id: 'q2' }],
        questionCount: 2,
      }

      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(mockQB)

      const result = await service.getQuestionBank('qb-1')

      expect(result?.id).toBe('qb-1')
      expect(result?.questionCount).toBe(2)
    })

    it('should return null if not found', async () => {
      questionBankRepositoryMock.findByIdWithCount.mockResolvedValue(null)

      const result = await service.getQuestionBank('nonexistent')

      expect(result).toBeNull()
    })
  })
})
