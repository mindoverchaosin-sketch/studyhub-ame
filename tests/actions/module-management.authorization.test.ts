import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('module management authorization', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('requires permission for create module actions', async () => {
    const requirePermission = vi.fn().mockRejectedValue(new Error('no'))
    const moduleRepository = { create: vi.fn() }

    vi.doMock('@/auth', () => ({ requirePermission }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))
    vi.doMock('@/server/services/module-management.service', () => ({
      ModuleManagementService: vi.fn().mockImplementation(() => ({ createModule: vi.fn() })),
    }))
    vi.doMock('next/cache', () => ({ revalidatePath: vi.fn() }))

    const { createModuleAction } = await import('../../server/actions/content-management.actions')

    await expect(createModuleAction({ title: 'New Module', slug: 'new-module', moduleNumber: '1', courseId: 'course-1' })).rejects.toThrow('no')
    expect(requirePermission).toHaveBeenCalled()
  })
})
