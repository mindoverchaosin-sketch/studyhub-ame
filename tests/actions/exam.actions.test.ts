import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRequireAuth = vi.fn()
const mockRequireStudent = vi.fn()
const mockRequirePermission = vi.fn()
const mockRequireOwnership = vi.fn()

vi.mock('@/auth', () => ({
  requireAuth: mockRequireAuth,
  requireStudent: mockRequireStudent,
  requirePermission: mockRequirePermission,
  requireOwnership: mockRequireOwnership,
  NotFoundError: class NotFoundError extends Error {
    constructor(message = 'Not found') {
      super(message)
      this.name = 'NotFoundError'
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
}))

const mockTemplateService = {
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  createTemplate: vi.fn(),
  activateTemplate: vi.fn(),
  deactivateTemplate: vi.fn(),
}

vi.mock('@/server/services/exam-template.service', () => mockTemplateService)

const mockAttemptService = {
  generateExamAttempt: vi.fn(),
}

vi.mock('@/server/services/exam-attempt.service', () => mockAttemptService)

describe('Exam Actions - Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listExamTemplates - Requires Authentication', () => {
    it('allows authenticated STUDENT to list templates', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireAuth.mockResolvedValue(studentSession)
      mockTemplateService.listTemplates.mockResolvedValue([
        { id: 'template-1', title: 'Math Quiz' },
      ])

      const result = await listExamTemplates({ active: true })

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.listTemplates).toHaveBeenCalledWith({ active: true })
      expect(result).toEqual([{ id: 'template-1', title: 'Math Quiz' }])
    })

    it('allows authenticated ADMIN to list templates', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequireAuth.mockResolvedValue(adminSession)
      mockTemplateService.listTemplates.mockResolvedValue([
        { id: 'template-1', title: 'Math Quiz' },
        { id: 'template-2', title: 'Science Quiz' },
      ])

      const result = await listExamTemplates()

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.listTemplates).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })

    it('denies unauthenticated access to list templates', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')

      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      await expect(listExamTemplates()).rejects.toThrow('Unauthorized')
      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.listTemplates).not.toHaveBeenCalled()
    })

    it('supports search parameter for authenticated users', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireAuth.mockResolvedValue(studentSession)
      mockTemplateService.listTemplates.mockResolvedValue([
        { id: 'template-1', title: 'Math Quiz' },
      ])

      await listExamTemplates({ search: 'Math' })

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.listTemplates).toHaveBeenCalledWith({
        search: 'Math',
      })
    })

    it('supports pagination parameters for authenticated users', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireAuth.mockResolvedValue(studentSession)
      mockTemplateService.listTemplates.mockResolvedValue([])

      await listExamTemplates({ page: 2, pageSize: 10 })

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.listTemplates).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
      })
    })
  })

  describe('getExamTemplate - Requires Authentication', () => {
    it('allows authenticated STUDENT to get template', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireAuth.mockResolvedValue(studentSession)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-1',
        title: 'Math Quiz',
      })

      const result = await getExamTemplate('template-1')

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith('template-1')
      expect(result).toEqual({ id: 'template-1', title: 'Math Quiz' })
    })

    it('allows authenticated ADMIN to get template', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequireAuth.mockResolvedValue(adminSession)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-1',
        title: 'Admin Template',
      })

      const result = await getExamTemplate('template-1')

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith('template-1')
      expect(result).toEqual({ id: 'template-1', title: 'Admin Template' })
    })

    it('denies unauthenticated access to get template', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')

      mockRequireAuth.mockRejectedValue(
        new Error('Session required')
      )

      await expect(getExamTemplate('template-1')).rejects.toThrow(
        'Session required'
      )
      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.getTemplate).not.toHaveBeenCalled()
    })

    it('handles not found template gracefully after auth check', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireAuth.mockResolvedValue(studentSession)
      mockTemplateService.getTemplate.mockRejectedValue(
        new Error('Template not found')
      )

      await expect(getExamTemplate('nonexistent')).rejects.toThrow(
        'Template not found'
      )
      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith('nonexistent')
    })
  })

  describe('createExamTemplate - Uses requirePermission', () => {
    it('allows APPROVED ADMIN/CONTENT_EDITOR to create template', async () => {
      const { createExamTemplate } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequirePermission.mockResolvedValue(adminSession)
      mockTemplateService.createTemplate.mockResolvedValue({
        id: 'new-template',
        title: 'New Template',
      })

      const result = await createExamTemplate({
        title: 'New Template',
        questions: [],
        isPremium: true,
      })

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.createTemplate).toHaveBeenCalledWith(expect.objectContaining({ isPremium: true }))
      expect(result).toEqual({ id: 'new-template', title: 'New Template' })
    })
  })

  describe('activateExamTemplate - Uses requirePermission', () => {
    it('allows APPROVED ADMIN/CONTENT_EDITOR to activate template', async () => {
      const { activateExamTemplate } = await import('@/server/actions/exam.actions')
      const contentEditorSession = {
        user: { id: 'editor-1', role: 'CONTENT_EDITOR' },
      }

      mockRequirePermission.mockResolvedValue(contentEditorSession)
      mockTemplateService.activateTemplate.mockResolvedValue({
        id: 'template-1',
        isActive: true,
      })

      const result = await activateExamTemplate('template-1', true)

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.activateTemplate).toHaveBeenCalled()
    })
  })

  describe('generateAttempt - Student exam attempt generation', () => {
    it('allows authenticated STUDENT to generate attempt', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockAttemptService.generateExamAttempt.mockResolvedValue({
        id: 'attempt-1',
        templateId: 'template-1',
        studentId: 'student-1',
      })

      const result = await generateAttempt('template-1', 'student-1')

      expect(mockRequireStudent).toHaveBeenCalled()
      expect(mockAttemptService.generateExamAttempt).toHaveBeenCalledWith('template-1', 'student-1')
    })

    it('denies unauthenticated attempt generation', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')

      mockRequireStudent.mockRejectedValue(new Error('Student session required'))

      await expect(generateAttempt('template-1', 'student-1')).rejects.toThrow(
        'Student session required'
      )
    })
  })
})
