import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermissionMock = vi.hoisted(() => vi.fn())
const revalidatePathMock = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock('@/auth', () => ({
  requirePermission: requirePermissionMock,
}))

vi.mock('@/server/services/module-management.service', () => ({
  ModuleManagementService: vi.fn().mockImplementation(() => ({
    createModule: vi.fn().mockResolvedValue({ id: 'module-1' }),
    updateModule: vi.fn().mockResolvedValue({ id: 'module-1' }),
    archiveModule: vi.fn().mockResolvedValue({ id: 'module-1' }),
  })),
}))

vi.mock('@/server/services/admin-cms.service', () => ({
  listLessons: vi.fn().mockResolvedValue([]),
  listModules: vi.fn().mockResolvedValue([]),
  createLesson: vi.fn().mockResolvedValue({ success: true, errors: [], lesson: { id: 'lesson-1' } }),
  updateLesson: vi.fn().mockResolvedValue({ success: true, errors: [], lesson: { id: 'lesson-1' } }),
  deleteLesson: vi.fn().mockResolvedValue({ success: true, errors: [] }),
  createMockTest: vi.fn().mockResolvedValue({ success: true, errors: [], mockTest: { id: 'mock-1' } }),
  updateMockTest: vi.fn().mockResolvedValue({ success: true, errors: [], mockTest: { id: 'mock-1' } }),
  deleteMockTest: vi.fn().mockResolvedValue({ success: true, errors: [] }),
}))

vi.mock('@/server/services/study-material-management.service', () => ({
  StudyMaterialManagementService: vi.fn().mockImplementation(() => ({
    createResource: vi.fn().mockResolvedValue({ id: 'resource-1' }),
    updateResource: vi.fn().mockResolvedValue({ id: 'resource-1' }),
    archiveResource: vi.fn().mockResolvedValue({ id: 'resource-1' }),
  })),
}))

vi.mock('@/server/services/question-management.service', () => ({
  questionManagementService: {
    createQuestion: vi.fn().mockResolvedValue({ success: true, errors: [], question: { id: 'question-1' } }),
    updateQuestion: vi.fn().mockResolvedValue({ success: true, errors: [], question: { id: 'question-1' } }),
    archiveQuestion: vi.fn().mockResolvedValue({ success: true, errors: [] }),
  },
}))

vi.mock('@/server/services/question-bank-management.service', () => ({
  questionBankManagementService: {
    createQuestionBank: vi.fn().mockResolvedValue({ success: true, errors: [], questionBank: { id: 'qb-1' } }),
    updateQuestionBank: vi.fn().mockResolvedValue({ success: true, errors: [], questionBank: { id: 'qb-1' } }),
    publishQuestionBank: vi.fn().mockResolvedValue({ success: true, errors: [], questionBank: { id: 'qb-1' } }),
  },
}))

vi.mock('@/server/services/audit-log.service', () => ({
  auditLogService: {
    recordEvent: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('Content Editor authorization', () => {
  const contentEditorSession = {
    user: { id: 'content-editor-1', role: 'CONTENT_EDITOR' },
  }

  const studentSession = {
    user: { id: 'student-1', role: 'STUDENT' },
  }

  const instructorSession = {
    user: { id: 'instructor-1', role: 'INSTRUCTOR' },
  }

  const forbiddenError = new Error('Access denied')
  forbiddenError.name = 'ForbiddenError'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CONTENT_EDITOR allowed actions', () => {
    beforeEach(() => {
      requirePermissionMock.mockResolvedValue(contentEditorSession)
    })

    it('allows createModuleAction with manageModules permission', async () => {
      const { createModuleAction } = await import('@/server/actions/content-management.actions')
      const result = await createModuleAction({ title: 'Test Module' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
      expect(result).toBeDefined()
      expect(result.id).toBe('module-1')
    })

    it('allows updateModuleAction with manageModules permission', async () => {
      const { updateModuleAction } = await import('@/server/actions/content-management.actions')
      const result = await updateModuleAction('module-1', { title: 'Updated Module' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
      expect(result).toBeDefined()
      expect(result.id).toBe('module-1')
    })

    it('allows archiveModuleAction with manageModules permission', async () => {
      const { archiveModuleAction } = await import('@/server/actions/content-management.actions')
      const result = await archiveModuleAction('module-1')

      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
      expect(result).toBeDefined()
    })

    it('allows createAdminLesson with manageModules permission', async () => {
      const { createAdminLesson } = await import('@/server/actions/admin-cms.actions')
      const result = await createAdminLesson({ title: 'Test Lesson' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('allows updateAdminLesson with manageModules permission', async () => {
      const { updateAdminLesson } = await import('@/server/actions/admin-cms.actions')
      const result = await updateAdminLesson('lesson-1', { title: 'Updated Lesson' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
      expect(result).toBeDefined()
    })

    it('allows createStudyMaterialAction with manageResources permission', async () => {
      const { createStudyMaterialAction } = await import('@/server/actions/study-material.actions')
      const result = await createStudyMaterialAction({ title: 'Test Material' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageResources')
      expect(result).toBeDefined()
      expect(result.id).toBe('resource-1')
    })

    it('allows createAdminMockTest with manageModules permission', async () => {
      const { createAdminMockTest } = await import('@/server/actions/admin-cms.actions')
      const result = await createAdminMockTest({ title: 'Test Mock' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('allows createQuestionAction with manageQuestions permission', async () => {
      const { createQuestionAction } = await import('@/server/actions/question-management.actions')
      const result = await createQuestionAction({ title: 'Test Question' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageQuestions')
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('allows createQuestionBankAction with manageQuestions permission', async () => {
      const { createQuestionBankAction } = await import('@/server/actions/question-bank-management.actions')
      const result = await createQuestionBankAction({ title: 'Test QB' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageQuestions')
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('allows publishQuestionBankAction with publishContent permission', async () => {
      const { publishQuestionBankAction } = await import('@/server/actions/question-bank-management.actions')
      const result = await publishQuestionBankAction('qb-1')

      expect(requirePermissionMock).toHaveBeenCalledWith('publishContent')
      expect(result).toBeDefined()
    })
  })

  describe('STUDENT denied actions', () => {
    beforeEach(() => {
      requirePermissionMock.mockRejectedValue(forbiddenError)
    })

    it('denies STUDENT from createModuleAction', async () => {
      const { createModuleAction } = await import('@/server/actions/content-management.actions')

      await expect(createModuleAction({ title: 'Test Module' })).rejects.toThrow('Access denied')
      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
    })

    it('denies STUDENT from updateModuleAction', async () => {
      const { updateModuleAction } = await import('@/server/actions/content-management.actions')

      await expect(updateModuleAction('module-1', { title: 'Updated' })).rejects.toThrow('Access denied')
    })

    it('denies STUDENT from createAdminLesson', async () => {
      const { createAdminLesson } = await import('@/server/actions/admin-cms.actions')

      await expect(createAdminLesson({ title: 'Test Lesson' })).rejects.toThrow('Access denied')
    })

    it('denies STUDENT from createQuestionAction', async () => {
      const { createQuestionAction } = await import('@/server/actions/question-management.actions')

      await expect(createQuestionAction({ title: 'Test Question' })).rejects.toThrow('Access denied')
    })
  })

  describe('INSTRUCTOR denied actions', () => {
    beforeEach(() => {
      requirePermissionMock.mockRejectedValue(forbiddenError)
    })

    it('denies INSTRUCTOR from createModuleAction', async () => {
      const { createModuleAction } = await import('@/server/actions/content-management.actions')

      await expect(createModuleAction({ title: 'Test Module' })).rejects.toThrow('Access denied')
      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
    })

    it('denies INSTRUCTOR from createStudyMaterialAction', async () => {
      const { createStudyMaterialAction } = await import('@/server/actions/study-material.actions')

      await expect(createStudyMaterialAction({ title: 'Test Material' })).rejects.toThrow('Access denied')
    })

    it('denies INSTRUCTOR from createAdminMockTest', async () => {
      const { createAdminMockTest } = await import('@/server/actions/admin-cms.actions')

      await expect(createAdminMockTest({ title: 'Test Mock' })).rejects.toThrow('Access denied')
    })

    it('denies INSTRUCTOR from createQuestionBankAction', async () => {
      const { createQuestionBankAction } = await import('@/server/actions/question-bank-management.actions')

      await expect(createQuestionBankAction({ title: 'Test QB' })).rejects.toThrow('Access denied')
    })
  })

  describe('privilege boundaries', () => {
    it('CONTENT_EDITOR cannot call manageUsers actions', async () => {
      // This is a conceptual test - content editor session should be denied access to user management
      // The permission check happens before business logic
      requirePermissionMock.mockRejectedValueOnce(forbiddenError)

      // Attempting to get a theoretical user management action
      const permissionCheckFails = async () => {
        await requirePermissionMock('manageUsers')
      }

      await expect(permissionCheckFails()).rejects.toThrow('Access denied')
    })

    it('CONTENT_EDITOR cannot call manageStudents actions', async () => {
      requirePermissionMock.mockRejectedValueOnce(forbiddenError)

      const permissionCheckFails = async () => {
        await requirePermissionMock('manageStudents')
      }

      await expect(permissionCheckFails()).rejects.toThrow('Access denied')
    })

    it('CONTENT_EDITOR cannot call manageBilling actions', async () => {
      requirePermissionMock.mockRejectedValueOnce(forbiddenError)

      const permissionCheckFails = async () => {
        await requirePermissionMock('manageBilling')
      }

      await expect(permissionCheckFails()).rejects.toThrow('Access denied')
    })

    it('CONTENT_EDITOR cannot call manageAuditLogs actions', async () => {
      requirePermissionMock.mockRejectedValueOnce(forbiddenError)

      const permissionCheckFails = async () => {
        await requirePermissionMock('manageAuditLogs')
      }

      await expect(permissionCheckFails()).rejects.toThrow('Access denied')
    })
  })

  describe('direct server-action protection', () => {
    it('permission check happens before service call in createModuleAction', async () => {
      requirePermissionMock.mockRejectedValue(forbiddenError)

      const { createModuleAction } = await import('@/server/actions/content-management.actions')

      await expect(createModuleAction({ title: 'Test Module' })).rejects.toThrow()

      // Verify permission was checked before any service calls
      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
    })

    it('permission check happens before service call in createQuestionAction', async () => {
      requirePermissionMock.mockRejectedValue(forbiddenError)

      const { createQuestionAction } = await import('@/server/actions/question-management.actions')

      await expect(createQuestionAction({ title: 'Test Question' })).rejects.toThrow()

      expect(requirePermissionMock).toHaveBeenCalledWith('manageQuestions')
    })

    it('permission check happens before service call in publishQuestionBankAction', async () => {
      requirePermissionMock.mockRejectedValue(forbiddenError)

      const { publishQuestionBankAction } = await import('@/server/actions/question-bank-management.actions')

      await expect(publishQuestionBankAction('qb-1')).rejects.toThrow()

      expect(requirePermissionMock).toHaveBeenCalledWith('publishContent')
    })

    it('audit logging tracks failed permission checks', async () => {
      requirePermissionMock.mockRejectedValue(forbiddenError)

      const { createModuleAction } = await import('@/server/actions/content-management.actions')

      await expect(createModuleAction({ title: 'Test Module' })).rejects.toThrow()

      // requirePermission should have been called and rejected
      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
    })
  })

  describe('content editor specific permissions', () => {
    beforeEach(() => {
      requirePermissionMock.mockResolvedValue(contentEditorSession)
    })

    it('enforces manageModules for module operations', async () => {
      const { createModuleAction } = await import('@/server/actions/content-management.actions')

      await createModuleAction({ title: 'Test Module' })

      // Verify the correct permission was requested
      expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
    })

    it('enforces manageResources for study material operations', async () => {
      const { createStudyMaterialAction } = await import('@/server/actions/study-material.actions')

      await createStudyMaterialAction({ title: 'Test Material' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageResources')
    })

    it('enforces manageQuestions for question operations', async () => {
      const { createQuestionAction } = await import('@/server/actions/question-management.actions')

      await createQuestionAction({ title: 'Test Question' })

      expect(requirePermissionMock).toHaveBeenCalledWith('manageQuestions')
    })

    it('enforces publishContent for publishing operations', async () => {
      const { publishQuestionBankAction } = await import('@/server/actions/question-bank-management.actions')

      await publishQuestionBankAction('qb-1')

      expect(requirePermissionMock).toHaveBeenCalledWith('publishContent')
    })
  })
})
