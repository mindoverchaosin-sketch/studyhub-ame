import { describe, expect, it, vi } from 'vitest'

describe('publishing authorization', () => {
  it('requires permission for publishing actions', async () => {
    const requirePermission = vi.fn().mockRejectedValue(new Error('no'))

    vi.doMock('@/auth', () => ({ requirePermission }))

    const { publishContentAction } = await import('../../server/actions/publishing.actions')

    await expect(publishContentAction('MODULE', 'm1')).rejects.toThrow('no')
    expect(requirePermission).toHaveBeenCalled()
  })
})
