import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findByIdMock } = vi.hoisted(() => ({
  findByIdMock: vi.fn(),
}))

vi.mock('@/server/repositories/user.repository', () => ({
  userRepository: { findById: findByIdMock },
}))

import { authOptions } from '@/lib/auth'

describe('auth session versioning', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findByIdMock.mockResolvedValue({ id: 'user-1', role: { name: 'STUDENT' }, sessionVersion: 2 })
  })

  it('does not refresh an existing JWT after the database session version changes', async () => {
    const token = await authOptions.callbacks!.jwt!({
      token: { id: 'user-1', sessionVersion: 1 },
      user: undefined,
    } as never)

    expect(token.sessionVersion).toBe(1)
  })

  it('preserves the legacy zero version without copying the current database value', async () => {
    const token = await authOptions.callbacks!.jwt!({
      token: { id: 'user-1' },
      user: undefined,
    } as never)

    expect(token.sessionVersion).toBeUndefined()

    const session = await authOptions.callbacks!.session!({
      session: { user: {} },
      token,
    } as never)

    expect((session.user as { sessionVersion?: number }).sessionVersion).toBe(0)
  })
})