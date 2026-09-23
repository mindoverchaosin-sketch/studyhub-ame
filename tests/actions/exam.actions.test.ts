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

vi.mock('@/server/services/exam-template.service', () => ({
  default: mockTemplateService,
  ...mockTemplateService,
}))

const mockAttemptService = {
  generateExamAttempt: vi.fn(),
}

vi.mock('@/server/services/exam-attempt.service', () => mockAttemptService)

const mockContentAccessService = {
  canAccessExamTemplate: vi.fn(),
}

vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: mockContentAccessService,
}))

describe('Exam Actions - Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('student-safe exam template reads', () => {
    it('allows an authenticated student to list active templates without admin permission', async () => {
      mockRequireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
      mockTemplateService.listTemplates.mockResolvedValue([{ id: 't1', name: 'Free Exam', active: true, createdAt: new Date(), updatedAt: new Date() }])
      const { listStudentExamTemplates } = await import('@/server/actions/exam.actions')

      const result = await listStudentExamTemplates()

      expect(mockRequireStudent).toHaveBeenCalledOnce()
      expect(mockRequirePermission).not.toHaveBeenCalled()
      expect(mockTemplateService.listTemplates).toHaveBeenCalledWith({ active: true })
      expect(result).toEqual([{ id: 't1', name: 'Free Exam', active: true }])
    })

    it('rejects unauthenticated students from listing templates', async () => {
      mockRequireStudent.mockRejectedValue(new Error('Session required'))
      const { listStudentExamTemplates } = await import('@/server/actions/exam.actions')

      await expect(listStudentExamTemplates()).rejects.toThrow('Session required')
      expect(mockTemplateService.listTemplates).not.toHaveBeenCalled()
    })
  })

  describe('listExamTemplates - Requires manageModules Permission', () => {
    it('denies STUDENT access to list templates', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequirePermission.mockRejectedValue(new Error('Forbidden'))

      await expect(listExamTemplates({ active: true })).rejects.toThrow('Forbidden')
      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.listTemplates).not.toHaveBeenCalled()
    })

    it('allows ADMIN to list templates', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequirePermission.mockResolvedValue(adminSession)
      mockTemplateService.listTemplates.mockResolvedValue([
        { id: 'template-1', title: 'Math Quiz' },
        { id: 'template-2', title: 'Science Quiz' },
      ])

      const result = await listExamTemplates()

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.listTemplates).toHaveBeenCalled()
      expect(result).toHaveLength(2)
    })

    it('allows CONTENT_EDITOR to list templates', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const editorSession = {
        user: { id: 'editor-1', role: 'CONTENT_EDITOR' },
      }

      mockRequirePermission.mockResolvedValue(editorSession)
      mockTemplateService.listTemplates.mockResolvedValue([
        { id: 'template-1', title: 'Math Quiz' },
      ])

      const result = await listExamTemplates({ active: true })

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.listTemplates).toHaveBeenCalledWith({ active: true })
      expect(result).toEqual([{ id: 'template-1', title: 'Math Quiz' }])
    })

    it('supports search parameter for authorized users', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequirePermission.mockResolvedValue(adminSession)
      mockTemplateService.listTemplates.mockResolvedValue([
        { id: 'template-1', title: 'Math Quiz' },
      ])

      await listExamTemplates({ search: 'Math' })

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.listTemplates).toHaveBeenCalledWith({
        search: 'Math',
      })
    })

    it('supports pagination parameters for authorized users', async () => {
      const { listExamTemplates } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequirePermission.mockResolvedValue(adminSession)
      mockTemplateService.listTemplates.mockResolvedValue([])

      await listExamTemplates({ page: 2, pageSize: 10 })

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.listTemplates).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
      })
    })
  })

  describe('getExamTemplate - Requires manageModules Permission', () => {
    it('denies STUDENT access to get template', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')

      mockRequirePermission.mockRejectedValue(new Error('Forbidden'))

      await expect(getExamTemplate('template-1')).rejects.toThrow('Forbidden')
      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.getTemplate).not.toHaveBeenCalled()
    })

    it('allows ADMIN to get template', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequirePermission.mockResolvedValue(adminSession)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-1',
        title: 'Admin Template',
      })

      const result = await getExamTemplate('template-1')

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith('template-1')
      expect(result).toEqual({ id: 'template-1', title: 'Admin Template' })
    })

    it('allows CONTENT_EDITOR to get template', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')
      const editorSession = {
        user: { id: 'editor-1', role: 'CONTENT_EDITOR' },
      }

      mockRequirePermission.mockResolvedValue(editorSession)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-1',
        title: 'Editor Template',
      })

      const result = await getExamTemplate('template-1')

      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith('template-1')
      expect(result).toEqual({ id: 'template-1', title: 'Editor Template' })
    })

    it('denies unauthenticated access to get template', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')

      mockRequirePermission.mockRejectedValue(
        new Error('Session required')
      )

      await expect(getExamTemplate('template-1')).rejects.toThrow(
        'Session required'
      )
      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
      expect(mockTemplateService.getTemplate).not.toHaveBeenCalled()
    })

    it('handles not found template gracefully after auth check', async () => {
      const { getExamTemplate } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequirePermission.mockResolvedValue(adminSession)
      mockTemplateService.getTemplate.mockRejectedValue(
        new Error('Template not found')
      )

      await expect(getExamTemplate('nonexistent')).rejects.toThrow(
        'Template not found'
      )
      expect(mockRequirePermission).toHaveBeenCalledWith('manageModules')
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
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-1',
        name: 'Free Template',
        isPremium: false,
        active: true,
        deletedAt: null,
        questionCount: 20,
      })
      mockAttemptService.generateExamAttempt.mockResolvedValue({
        id: 'attempt-1',
        templateId: 'template-1',
        studentId: 'student-1',
      })

      const result = await generateAttempt('template-1', 'student-1')

      expect(mockRequireStudent).toHaveBeenCalled()
      expect(mockTemplateService.getTemplate).toHaveBeenCalledWith('template-1')
      expect(mockAttemptService.generateExamAttempt).toHaveBeenCalledWith('template-1', 'student-1')
      expect(result.id).toBe('attempt-1')
    })

    it('denies unauthenticated attempt generation', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')

      mockRequireStudent.mockRejectedValue(new Error('Student session required'))

      await expect(generateAttempt('template-1', 'student-1')).rejects.toThrow(
        'Student session required'
      )
      expect(mockTemplateService.getTemplate).not.toHaveBeenCalled()
      expect(mockAttemptService.generateExamAttempt).not.toHaveBeenCalled()
    })

    it('skips premium entitlement check for free templates', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-free',
        name: 'Free Template',
        isPremium: false,
        active: true,
        deletedAt: null,
      })
      mockAttemptService.generateExamAttempt.mockResolvedValue({ id: 'attempt-free' })

      await expect(generateAttempt('template-free', 'student-1')).resolves.toEqual({ id: 'attempt-free' })

      expect(mockContentAccessService.canAccessExamTemplate).not.toHaveBeenCalled()
      expect(mockAttemptService.generateExamAttempt).toHaveBeenCalledWith('template-free', 'student-1')
    })

    it('denies premium module-tied template when entitlement check fails', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-premium',
        name: 'Premium Template',
        isPremium: true,
        moduleId: 'module-1',
        active: true,
        deletedAt: null,
      })
      mockContentAccessService.canAccessExamTemplate.mockResolvedValue({
        allowed: false,
        reason: 'Premium exam template access required (premiumModules)',
        requiredFeature: 'premiumModules',
      })

      await expect(generateAttempt('template-premium', 'student-1')).rejects.toThrow(
        'Premium exam template access required (premiumModules)'
      )

      expect(mockContentAccessService.canAccessExamTemplate).toHaveBeenCalledWith(
        'student-1',
        true,
        'module'
      )
      expect(mockAttemptService.generateExamAttempt).not.toHaveBeenCalled()
    })

    it('allows premium module-tied template when entitlement grants access', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-premium',
        name: 'Premium Template',
        isPremium: true,
        moduleId: 'module-1',
        active: true,
        deletedAt: null,
      })
      mockContentAccessService.canAccessExamTemplate.mockResolvedValue({
        allowed: true,
        requiredFeature: 'premiumModules',
      })
      mockAttemptService.generateExamAttempt.mockResolvedValue({
        id: 'attempt-premium',
        templateId: 'template-premium',
        studentId: 'student-1',
      })

      const result = await generateAttempt('template-premium', 'student-1')

      expect(mockContentAccessService.canAccessExamTemplate).toHaveBeenCalledWith(
        'student-1',
        true,
        'module'
      )
      expect(mockAttemptService.generateExamAttempt).toHaveBeenCalledWith('template-premium', 'student-1')
      expect(result.id).toBe('attempt-premium')
    })

    it('uses standalone context for premium templates without a module', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-standalone',
        name: 'Standalone Premium Mock Exam',
        isPremium: true,
        moduleId: null,
        active: true,
        deletedAt: null,
      })
      mockContentAccessService.canAccessExamTemplate.mockResolvedValue({
        allowed: true,
        requiredFeature: 'unlimitedMockExams',
      })
      mockAttemptService.generateExamAttempt.mockResolvedValue({
        id: 'attempt-standalone',
        templateId: 'template-standalone',
        studentId: 'student-1',
      })

      const result = await generateAttempt('template-standalone', 'student-1')

      expect(mockContentAccessService.canAccessExamTemplate).toHaveBeenCalledWith(
        'student-1',
        true,
        'standalone'
      )
      expect(result.id).toBe('attempt-standalone')
    })

    it('reports missing template before creating an attempt', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue(null)

      await expect(generateAttempt('missing-template', 'student-1')).rejects.toThrow('Template not found.')

      expect(mockContentAccessService.canAccessExamTemplate).not.toHaveBeenCalled()
      expect(mockAttemptService.generateExamAttempt).not.toHaveBeenCalled()
    })

    it('checks ownership before template retrieval', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }
      const ownershipOrder: string[] = []

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => {
        ownershipOrder.push('ownership')
        throw new Error('Access denied.')
      })
      mockTemplateService.getTemplate.mockImplementation(async () => {
        ownershipOrder.push('template')
        return { id: 'template-1', isPremium: false, active: true, deletedAt: null }
      })

      await expect(generateAttempt('template-1', 'student-2')).rejects.toThrow('Access denied.')

      expect(ownershipOrder).toEqual(['ownership'])
      expect(mockAttemptService.generateExamAttempt).not.toHaveBeenCalled()
    })

    it('allows ADMIN to generate an attempt for another student', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const adminSession = {
        user: { id: 'admin-1', role: 'ADMIN' },
      }

      mockRequireStudent.mockResolvedValue(adminSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-1',
        name: 'Free Template',
        isPremium: false,
        active: true,
        deletedAt: null,
      })
      mockAttemptService.generateExamAttempt.mockResolvedValue({
        id: 'attempt-admin',
        templateId: 'template-1',
        studentId: 'student-2',
      })

      await expect(generateAttempt('template-1', 'student-2')).resolves.toMatchObject({
        id: 'attempt-admin',
        studentId: 'student-2',
      })

      expect(mockRequireOwnership).toHaveBeenCalledWith('student-2', 'admin-1', true, 'ADMIN')
      expect(mockAttemptService.generateExamAttempt).toHaveBeenCalledWith('template-1', 'student-2')
    })

    it('rejects inactive template before generating attempt', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-inactive',
        name: 'Inactive Template',
        active: false,
        isPremium: false,
        deletedAt: null,
      })

      await expect(generateAttempt('template-inactive', 'student-1')).rejects.toThrow('This exam is no longer available.')

      expect(mockAttemptService.generateExamAttempt).not.toHaveBeenCalled()
    })

    it('allows active template even after entitlement check', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const studentSession = {
        user: { id: 'student-1', role: 'STUDENT' },
      }

      mockRequireStudent.mockResolvedValue(studentSession)
      mockRequireOwnership.mockImplementation(() => undefined)
      mockTemplateService.getTemplate.mockResolvedValue({
        id: 'template-active',
        name: 'Active Template',
        active: true,
        isPremium: false,
      })
      mockAttemptService.generateExamAttempt.mockResolvedValue({
        id: 'attempt-active',
        templateId: 'template-active',
        studentId: 'student-1',
      })

      const result = await generateAttempt('template-active', 'student-1')

      expect(mockAttemptService.generateExamAttempt).toHaveBeenCalledWith('template-active', 'student-1')
      expect(result.id).toBe('attempt-active')
    })
  })
})
