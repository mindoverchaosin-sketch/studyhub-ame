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

    const { createModuleAction } = await import('../../server/actions/content-management.actions')

    await expect(createModuleAction({ title: 'New Module' } as any)).rejects.toThrow('no')
    expect(requirePermission).toHaveBeenCalled()
  })
})
