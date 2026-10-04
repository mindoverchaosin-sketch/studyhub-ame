import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('user lifecycle service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('marks temporary suspension as active once expiry passes', async () => {
    const { getAccountStatus } = await import('@/server/services/account-status.service')

    expect(getAccountStatus({ accountStatus: 'SUSPENDED', suspensionType: 'TEMPORARY', suspensionEndsAt: new Date(Date.now() - 1000) })).toBe('ACTIVE')
    expect(getAccountStatus({ accountStatus: 'SUSPENDED', suspensionType: 'TEMPORARY', suspensionEndsAt: new Date(Date.now() + 60000) })).toBe('SUSPENDED')
  })

  it('suspends a user temporarily and records the expiry', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'admin-1', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true, suspensionType: null, suspensionEndsAt: null, sessionVersion: 1 }),
      revokeAllSessionsForUser: vi.fn().mockResolvedValue({ deletedCount: 1, sessionVersion: 2 }),
    }

    const prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1', role: { name: 'STUDENT' }, accountStatus: 'ACTIVE', isActive: true, suspensionType: null, suspensionEndsAt: null, sessionVersion: 1 }),
        update: vi.fn().mockResolvedValue({ id: 'user-1', role: { name: 'STUDENT' }, accountStatus: 'SUSPENDED', suspensionType: 'TEMPORARY', suspensionEndsAt: new Date('2030-01-01T00:00:00.000Z') }),
      },
      session: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: vi.fn(async (callback) => callback({
        session: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
        user: {
          update: vi.fn().mockResolvedValue({
            id: 'user-1',
            role: { name: 'STUDENT' },
            accountStatus: 'SUSPENDED',
            suspensionType: 'TEMPORARY',
            suspensionEndsAt: new Date('2030-01-01T00:00:00.000Z'),
          }),
        },
      })),
    }

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

    const { suspendUserTemporarily } = await import('@/server/services/user-lifecycle.service')
    const result = await suspendUserTemporarily('user-1', 'Repeated policy violation', new Date('2030-01-01T00:00:00.000Z'), 'admin-1')

    expect(prismaMock.$transaction).toHaveBeenCalled()
    expect(result.accountStatus).toBe('SUSPENDED')
  })

  it('falls back to STUDENT when revoking a privileged role', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'admin-1', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true, sessionVersion: 2 }),
      revokeAllSessionsForUser: vi.fn().mockResolvedValue({ deletedCount: 1, sessionVersion: 3 }),
    }

    const prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-2', role: { name: 'ADMIN' }, accountStatus: 'ACTIVE', isActive: true, sessionVersion: 1 }),
      },
      $transaction: vi.fn(),
    }
    const deleteSessions = vi.fn().mockResolvedValue({ count: 1 })
    const updateUser = vi.fn().mockResolvedValue({ id: 'user-2', role: { name: 'STUDENT' }, accountStatus: 'ACTIVE' })
    prismaMock.$transaction.mockImplementation(async (callback) => callback({ session: { deleteMany: deleteSessions }, user: { update: updateUser } }))

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn().mockResolvedValue({ id: 'role-student', name: 'STUDENT' }), create: vi.fn() } }))

    const { revokePrivilegedRole } = await import('@/server/services/user-lifecycle.service')
    const result = await revokePrivilegedRole('user-2', 'Role no longer needed', 'admin-1')

    expect(result.role).toBe('STUDENT')
    expect(deleteSessions).toHaveBeenCalledWith({ where: { userId: 'user-2' } })
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-2' },
      data: { roleId: 'role-student', sessionVersion: { increment: 1 } },
    }))
  })

  it('reactivates a suspended account and invalidates its old sessions', async () => {
    const userRepository = { findById: vi.fn().mockResolvedValue({ id: 'admin-1', role: { name: 'SUPER_ADMIN' } }) }
    const prismaMock = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user-3', role: { name: 'STUDENT' }, isActive: false, accountStatus: 'SUSPENDED', suspensionType: 'INDEFINITE' }) },
      $transaction: vi.fn(),
    }
    const deleteSessions = vi.fn().mockResolvedValue({ count: 2 })
    const updateUser = vi.fn().mockResolvedValue({ id: 'user-3', role: { name: 'STUDENT' }, accountStatus: 'ACTIVE' })
    prismaMock.$transaction.mockImplementation(async (callback) => callback({ session: { deleteMany: deleteSessions }, user: { update: updateUser } }))

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

    const { reactivateUserAccount } = await import('@/server/services/user-lifecycle.service')
    const result = await reactivateUserAccount('user-3', 'Review completed', 'admin-1')

    expect(result).toMatchObject({ accountStatus: 'ACTIVE', oldStatus: 'SUSPENDED' })
    expect(deleteSessions).toHaveBeenCalledWith({ where: { userId: 'user-3' } })
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-3' },
      data: expect.objectContaining({
        isActive: true,
        accountStatus: 'ACTIVE',
        suspensionType: null,
        suspensionEndsAt: null,
        sessionVersion: { increment: 1 },
      }),
    }))
  })

  it('terminates without deleting the user record and rejects repeated termination', async () => {
    const userRepository = { findById: vi.fn().mockResolvedValue({ id: 'admin-1', role: { name: 'SUPER_ADMIN' } }) }
    const deleteUser = vi.fn()
    const updateUser = vi.fn().mockResolvedValue({ id: 'user-4', role: { name: 'STUDENT' }, accountStatus: 'TERMINATED' })
    const prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-4', role: { name: 'STUDENT' }, isActive: true, accountStatus: 'ACTIVE' }),
        delete: deleteUser,
      },
      $transaction: vi.fn(async (callback) => callback({
        session: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
        user: { update: updateUser },
      })),
    }

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

    const { terminateUserPermanently } = await import('@/server/services/user-lifecycle.service')
    await expect(terminateUserPermanently('user-4', 'Confirmed policy breach', 'admin-1')).resolves.toMatchObject({ accountStatus: 'TERMINATED' })
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-4' },
      data: expect.objectContaining({ accountStatus: 'TERMINATED', isActive: false, terminationReason: 'Confirmed policy breach', sessionVersion: { increment: 1 } }),
    }))
    expect(deleteUser).not.toHaveBeenCalled()

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-4', role: { name: 'STUDENT' }, isActive: false, accountStatus: 'TERMINATED' })
    await expect(terminateUserPermanently('user-4', 'Repeated request', 'admin-1')).rejects.toThrow('The user is already terminated.')
    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
  })

  it('rejects missing targets and prevents self-suspension or self-role revocation', async () => {
    const userRepository = { findById: vi.fn().mockResolvedValue({ id: 'super-1', role: { name: 'SUPER_ADMIN' } }) }
    const target = { id: 'super-1', role: { name: 'SUPER_ADMIN' }, isActive: true, accountStatus: 'ACTIVE' }
    const prismaMock = {
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn(),
    }

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

    const { suspendUserIndefinitely, revokePrivilegedRole } = await import('@/server/services/user-lifecycle.service')
    await expect(suspendUserIndefinitely('missing-user', 'Policy violation', 'super-1')).rejects.toThrow('Target user was not found.')

    prismaMock.user.findUnique.mockResolvedValue(target)
    await expect(suspendUserIndefinitely('super-1', 'Policy violation', 'super-1')).rejects.toThrow('cannot suspend itself')
    await expect(revokePrivilegedRole('super-1', 'Role change', 'super-1')).rejects.toThrow('revoke the role of itself')
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

    it('revokes sessions through the repository versioning mechanism', async () => {
      const revokeAllSessionsForUser = vi.fn().mockResolvedValue({ deletedCount: 2, sessionVersion: 5 })
      const userRepository = {
        findById: vi.fn().mockResolvedValue({ id: 'admin-1', role: { name: 'SUPER_ADMIN' } }),
        revokeAllSessionsForUser,
      }
      const prismaMock = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 'user-5', role: { name: 'STUDENT' }, accountStatus: 'ACTIVE', isActive: true }),
        },
      }

      vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
      vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
      vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

      const { revokeAllUserSessions } = await import('@/server/services/user-lifecycle.service')

      await expect(revokeAllUserSessions('user-5', 'Security review', 'admin-1')).resolves.toEqual({
        userId: 'user-5',
        deletedCount: 2,
        accountStatus: 'ACTIVE',
      })
      expect(revokeAllSessionsForUser).toHaveBeenCalledWith('user-5')
    })

  it('prevents self-termination and last-super-admin removal', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'super-1', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true, sessionVersion: 1 }),
      revokeAllSessionsForUser: vi.fn(),
    }

    const prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'super-1', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true, sessionVersion: 1 }),
      },
      session: { deleteMany: vi.fn() },
      $transaction: vi.fn(),
    }

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

    const { terminateUserPermanently } = await import('@/server/services/user-lifecycle.service')

    await expect(terminateUserPermanently('super-1', 'No reason', 'super-1')).rejects.toThrow(/cannot terminate itself|last active Super Admin/i)
  })

  it('checks the last active Super Admin inside a serializable suspension transaction', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'admin-1', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true }),
    }
    const countActiveSuperAdmins = vi.fn().mockResolvedValue(1)
    const updateUser = vi.fn()
    const prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'super-2', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true }),
      },
      $transaction: vi.fn(async (callback) => callback({
        user: { count: countActiveSuperAdmins, update: updateUser },
        session: { deleteMany: vi.fn() },
      })),
    }
    const { effectiveAccountStatusWhere } = await vi.importActual<typeof import('@/server/repositories/user.repository')>('@/server/repositories/user.repository')

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', () => ({ userRepository, effectiveAccountStatusWhere }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

    const { suspendUserIndefinitely, terminateUserPermanently, revokePrivilegedRole } = await import('@/server/services/user-lifecycle.service')

    await expect(suspendUserIndefinitely('super-2', 'Policy violation', 'admin-1')).rejects.toThrow(/last active Super Admin cannot be suspended/i)
    expect(countActiveSuperAdmins).toHaveBeenCalled()
    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
    expect(updateUser).not.toHaveBeenCalled()

    await expect(terminateUserPermanently('super-2', 'Confirmed policy breach', 'admin-1')).rejects.toThrow(/last active Super Admin cannot be terminated/i)
    await expect(revokePrivilegedRole('super-2', 'Demotion request', 'admin-1')).rejects.toThrow(/Super Admin privileges cannot be revoked/i)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('counts expired temporary Super Admin suspensions as active for last-admin protection', async () => {
    const userRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'admin-1', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true }),
    }
    const countActiveSuperAdmins = vi.fn().mockResolvedValue(2)
    const updateUser = vi.fn().mockResolvedValue({ id: 'super-2', role: { name: 'SUPER_ADMIN' } })
    const prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'super-2', role: { name: 'SUPER_ADMIN' }, accountStatus: 'ACTIVE', isActive: true }),
      },
      $transaction: vi.fn(async (callback) => callback({
        user: { count: countActiveSuperAdmins, update: updateUser },
        session: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      })),
    }

    vi.doMock('@/lib/prisma', () => ({ default: prismaMock }))
    vi.doMock('@/server/repositories/user.repository', async (importOriginal) => ({
      ...(await importOriginal<typeof import('@/server/repositories/user.repository')>()),
      userRepository,
    }))
    vi.doMock('@/server/repositories/role.repository', () => ({ roleRepository: { findByName: vi.fn(), create: vi.fn() } }))

    const { suspendUserIndefinitely } = await import('@/server/services/user-lifecycle.service')

    await suspendUserIndefinitely('super-2', 'Policy violation', 'admin-1')

    expect(countActiveSuperAdmins).toHaveBeenCalledWith({
      where: {
        role: { is: { name: 'SUPER_ADMIN' } },
        AND: [
          { accountStatus: { not: 'TERMINATED' } },
          {
            OR: [
              { AND: [{ isActive: true }, { accountStatus: { not: 'SUSPENDED' } }] },
              { suspensionType: 'TEMPORARY', suspensionEndsAt: { lte: expect.any(Date) } },
            ],
          },
        ],
      },
    })
    expect(updateUser).toHaveBeenCalledOnce()
  })
})