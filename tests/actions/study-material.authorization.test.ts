import { describe, expect, it, vi } from 'vitest'

describe('study material authorization', () => {
  it('requires permission for study material actions', async () => {
    const requirePermission = vi.fn().mockRejectedValue(new Error('no'))
    vi.doMock('@/auth', () => ({ requirePermission }))

    const { createStudyMaterialAction } = await import('../../server/actions/study-material.actions')

    await expect(createStudyMaterialAction({ title: 'Notes' } as any)).rejects.toThrow('no')
    expect(requirePermission).toHaveBeenCalled()
  })
})
