import { describe, it, expect, beforeEach, vi } from 'vitest'

const {
  questionBankManagementServiceMock,
  withAuditLoggingMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  questionBankManagementServiceMock: {
    createQuestionBank: vi.fn(),
    updateQuestionBank: vi.fn(),
    archiveQuestionBank: vi.fn(),
    publishQuestionBank: vi.fn(),
    getQuestionBank: vi.fn(),
  },
  withAuditLoggingMock: vi.fn(async (config: any) => config.run()),
  revalidatePathMock: vi.fn(),
}))

vi.mock('@/server/services/question-bank-management.service', () => ({
  questionBankManagementService: questionBankManagementServiceMock,
}))

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('@/server/actions/audit-helpers', () => ({
  withAuditLogging: withAuditLoggingMock,
}))

// Mock auth module
const mockRequirePermission = vi.fn()

vi.mock('@/auth', () => ({
  requirePermission: mockRequirePermission,
}))

describe('Question Bank Management Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createQuestionBankAction', () => {
    it('should require manageQuestions permission', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Permission denied'))

      const { createQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      try {
        await createQuestionBankAction({ title: 'Test' })
      } catch (error) {
        // Expected to throw
      }

      expect(mockRequirePermission).toHaveBeenCalledWith('manageQuestions')
    })

    it('should call service with input', async () => {
      mockRequirePermission.mockResolvedValue(true)
      questionBankManagementServiceMock.createQuestionBank.mockResolvedValue({
        success: true,
        errors: [],
        questionBank: { id: 'qb-1', title: 'Test', isPremium: false },
      })

      const { createQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      const result = await createQuestionBankAction({ title: 'Test' })

      expect(result.success).toBe(true)
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin/questions')
    })

    it('should use audit logging with correct metadata', async () => {
      mockRequirePermission.mockResolvedValue(true)
      questionBankManagementServiceMock.createQuestionBank.mockResolvedValue({
        success: true,
        errors: [],
      })

      const { createQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      await createQuestionBankAction({ title: 'Test' })

      expect(withAuditLoggingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'manageQuestions',
          action: 'question-bank.create',
          entityType: 'QUESTION_BANK',
        })
      )
    })
  })

  describe('updateQuestionBankAction', () => {
    it('should require manageQuestions permission', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Permission denied'))

      const { updateQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      try {
        await updateQuestionBankAction('qb-1', { title: 'Updated' })
      } catch (error) {
        // Expected to throw
      }

      expect(mockRequirePermission).toHaveBeenCalledWith('manageQuestions')
    })

    it('should call service with ID and input', async () => {
      mockRequirePermission.mockResolvedValue(true)
      questionBankManagementServiceMock.updateQuestionBank.mockResolvedValue({
        success: true,
        errors: [],
        questionBank: { id: 'qb-1', title: 'Updated' },
      })

      const { updateQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      const result = await updateQuestionBankAction('qb-1', { title: 'Updated' })

      expect(result.success).toBe(true)
      expect(revalidatePathMock).toHaveBeenCalledWith('/admin/questions')
    })
  })

  describe('archiveQuestionBankAction', () => {
    it('should require manageQuestions permission', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Permission denied'))

      const { archiveQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      try {
        await archiveQuestionBankAction('qb-1')
      } catch (error) {
        // Expected to throw
      }

      expect(mockRequirePermission).toHaveBeenCalledWith('manageQuestions')
    })

    it('should call service with ID', async () => {
      mockRequirePermission.mockResolvedValue(true)
      questionBankManagementServiceMock.archiveQuestionBank.mockResolvedValue({
        success: true,
        errors: [],
        questionBank: { id: 'qb-1', status: 'ARCHIVED' },
      })

      const { archiveQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      const result = await archiveQuestionBankAction('qb-1')

      expect(result.success).toBe(true)
    })
  })

  describe('publishQuestionBankAction', () => {
    it('should require publishContent permission', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Permission denied'))

      const { publishQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      try {
        await publishQuestionBankAction('qb-1')
      } catch (error) {
        // Expected to throw
      }

      expect(mockRequirePermission).toHaveBeenCalledWith('publishContent')
    })

    it('should call service with ID', async () => {
      mockRequirePermission.mockResolvedValue(true)
      questionBankManagementServiceMock.publishQuestionBank.mockResolvedValue({
        success: true,
        errors: [],
        questionBank: { id: 'qb-1', status: 'PUBLISHED' },
      })

      const { publishQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      const result = await publishQuestionBankAction('qb-1')

      expect(result.success).toBe(true)
    })
  })

  describe('getQuestionBankAction', () => {
    it('should require manageQuestions permission', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Permission denied'))

      const { getQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      try {
        await getQuestionBankAction('qb-1')
      } catch (error) {
        // Expected to throw
      }

      expect(mockRequirePermission).toHaveBeenCalledWith('manageQuestions')
    })

    it('should call service and return result', async () => {
      mockRequirePermission.mockResolvedValue(true)
      questionBankManagementServiceMock.getQuestionBank.mockResolvedValue({
        id: 'qb-1',
        title: 'Test',
        isPremium: false,
      })

      const { getQuestionBankAction } = await import('../../server/actions/question-bank-management.actions')

      const result = await getQuestionBankAction('qb-1')

      expect(result?.id).toBe('qb-1')
    })
  })
})
