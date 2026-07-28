import { describe, expect, it, vi } from 'vitest'

describe('question management authorization', () => {
  it('requires permission for question management actions', async () => {
    const requirePermission = vi.fn().mockRejectedValue(new Error('no'))

    vi.doMock('@/auth', () => ({ requirePermission }))

    const { createQuestionAction } = await import('../../server/actions/question-management.actions')

    await expect(createQuestionAction({ prompt: 'Question' } as any)).rejects.toThrow('no')
    expect(requirePermission).toHaveBeenCalled()
  })
})
