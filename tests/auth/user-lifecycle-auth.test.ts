import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUserByEmail, findById, getServerSession, comparePassword } = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  findById: vi.fn(),
  getServerSession: vi.fn(),
  comparePassword: vi.fn(),
}))

vi.mock('next-auth', () => ({ getServerSession, default: {} }))
vi.mock('next-auth/providers/credentials', () => ({ default: (options: unknown) => options }))
vi.mock('bcrypt', () => ({ default: { compare: comparePassword } }))
vi.mock('@/server/services/user.service', () => ({ getUserByEmail }))
vi.mock('@/server/repositories/user.repository', () => ({ userRepository: { findById } }))
vi.mock('@/server/repositories/role.repository', () => ({ roleRepository: { getPermissionsForUser: vi.fn() } }))
vi.mock('@/server/services/audit-log.service', () => ({ auditLogService: { recordEvent: vi.fn() } }))

import { authOptions, getCurrentUser } from '@/lib/auth'

type CredentialsProvider = {
  authorize(credentials: { email: string; password: string }): Promise<unknown>
}

const authorize = (authOptions.providers[0] as unknown as CredentialsProvider).authorize
const credentials = { email: 'user@example.com', password: 'password' }
const baseUser = {
  id: 'user-1',
  email: credentials.email,
  displayName: 'Example User',
  passwordHash: 'hashed-password',
  role: { name: 'STUDENT' },
  isActive: false,
  accountStatus: 'SUSPENDED',
  sessionVersion: 3,
}

describe('account lifecycle authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    comparePassword.mockResolvedValue(true)
    getUserByEmail.mockResolvedValue(baseUser)
    getServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT', sessionVersion: 3 } })
    findById.mockResolvedValue(baseUser)
  })

  it('blocks login and access during an unexpired temporary suspension', async () => {
    getUserByEmail.mockResolvedValue({
      ...baseUser,
      suspensionType: 'TEMPORARY',
      suspensionEndsAt: new Date(Date.now() + 60_000),
    })
    findById.mockResolvedValue({
      ...baseUser,
      suspensionType: 'TEMPORARY',
      suspensionEndsAt: new Date(Date.now() + 60_000),
    })

    await expect(authorize(credentials)).resolves.toBeNull()
    await expect(getCurrentUser()).resolves.toBeNull()
    expect(comparePassword).not.toHaveBeenCalled()
  })

  it('allows login and access after temporary suspension expiry', async () => {
    const expiredUser = {
      ...baseUser,
      suspensionType: 'TEMPORARY',
      suspensionEndsAt: new Date(Date.now() - 60_000),
    }
    getUserByEmail.mockResolvedValue(expiredUser)
    findById.mockResolvedValue(expiredUser)

    await expect(authorize(credentials)).resolves.toMatchObject({ id: 'user-1', role: 'STUDENT' })
    await expect(getCurrentUser()).resolves.toMatchObject({ user: { id: 'user-1', role: 'STUDENT' } })
    expect(comparePassword).toHaveBeenCalledWith(credentials.password, 'hashed-password')
  })

  it.each([
    ['indefinite suspension', { suspensionType: 'INDEFINITE', suspensionEndsAt: null }],
    ['termination', { accountStatus: 'TERMINATED', suspensionType: null, terminationReason: 'Policy breach' }],
  ])('continues blocking login and access for %s', async (_label, statusFields) => {
    const blockedUser = { ...baseUser, ...statusFields }
    getUserByEmail.mockResolvedValue(blockedUser)
    findById.mockResolvedValue(blockedUser)

    await expect(authorize(credentials)).resolves.toBeNull()
    await expect(getCurrentUser()).resolves.toBeNull()
    expect(comparePassword).not.toHaveBeenCalled()
  })

  it('invalidates an existing session after the database session version changes', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT', sessionVersion: 2 } })
    findById.mockResolvedValue({ ...baseUser, sessionVersion: 3 })

    await expect(getCurrentUser()).resolves.toBeNull()
  })
})