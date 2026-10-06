import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasPermission, type AppRole } from '@/server/services/authorization.service'

const mocks = vi.hoisted(() => ({
  createQuiz: vi.fn(),
  updateQuiz: vi.fn(),
  setStatus: vi.fn(),
  activeRole: { value: 'ADMIN' as AppRole },
}))

describe('Quiz management action authorization', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.activeRole.value = 'ADMIN'
    mocks.createQuiz.mockResolvedValue({ id: 'quiz-1', moduleId: 'module-1' })
    mocks.updateQuiz.mockResolvedValue({ id: 'quiz-1', moduleId: 'module-1' })
    mocks.setStatus.mockResolvedValue({ id: 'quiz-1', moduleId: 'module-1' })

    vi.doMock('@/auth', () => ({
      requirePermission: vi.fn(async (permission: string) => {
        if (!hasPermission(mocks.activeRole.value, permission as Parameters<typeof hasPermission>[1])) {
          throw new Error('Permission denied')
        }
        return { user: { id: 'user-1', role: mocks.activeRole.value } }
      }),
    }))
    vi.doMock('@/server/actions/audit-helpers', () => ({
      withAuditLogging: async ({ run }: { run: () => Promise<unknown> }) => run(),
    }))
    vi.doMock('@/server/services/quiz-management.service', () => ({
      quizManagementService: {
        create: mocks.createQuiz,
        update: mocks.updateQuiz,
        setStatus: mocks.setStatus,
      },
    }))
    vi.doMock('next/cache', () => ({ revalidatePath: vi.fn() }))
  })

  it('rejects Instructor mutations before the Quiz service is called', async () => {
    mocks.activeRole.value = 'INSTRUCTOR'
    const { createAdminQuiz } = await import('@/server/actions/quiz-management.actions')

    await expect(createAdminQuiz({
      moduleId: 'module-1',
      title: 'Quiz',
      questionBankIds: [],
    })).rejects.toThrow('Permission denied')
    expect(mocks.createQuiz).not.toHaveBeenCalled()
  })

  it.each(['CONTENT_EDITOR', 'ADMIN', 'SUPER_ADMIN'] as const)(
    'allows %s to invoke a permitted Quiz mutation',
    async (role) => {
      mocks.activeRole.value = role
      const { createAdminQuiz } = await import('@/server/actions/quiz-management.actions')

      await expect(createAdminQuiz({
        moduleId: 'module-1',
        title: 'Quiz',
        questionBankIds: [],
      })).resolves.toEqual({ id: 'quiz-1', moduleId: 'module-1' })
      expect(mocks.createQuiz).toHaveBeenCalledOnce()
    },
  )

  it('requires publishContent permission for publishing', async () => {
    mocks.activeRole.value = 'INSTRUCTOR'
    const { setAdminQuizStatus } = await import('@/server/actions/quiz-management.actions')

    await expect(setAdminQuizStatus('quiz-1', 'PUBLISHED')).rejects.toThrow('Permission denied')
    expect(mocks.setStatus).not.toHaveBeenCalled()
  })
})
