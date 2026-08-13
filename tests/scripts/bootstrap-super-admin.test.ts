import { beforeEach, describe, expect, it, vi } from 'vitest'

const { bcryptHashMock, prismaMock } = vi.hoisted(() => ({
  bcryptHashMock: vi.fn(),
  prismaMock: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: bcryptHashMock,
  },
}))

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}))

import { bootstrapSuperAdmin, validateSuperAdminBootstrapInputs } from '@/scripts/bootstrap-super-admin'

describe('super admin bootstrap', () => {
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPER_ADMIN_EMAIL = undefined
    process.env.SUPER_ADMIN_PASSWORD = undefined
    bcryptHashMock.mockResolvedValue('hashed-secret')
  })

  it('rejects missing email safely', async () => {
    await expect(
      bootstrapSuperAdmin({
        email: '',
        password: 'StrongPass123',
        logger,
        prismaClient: prismaMock as any,
      }),
    ).rejects.toThrow('SUPER_ADMIN_EMAIL is required.')
  })

  it('rejects missing password safely', async () => {
    await expect(
      bootstrapSuperAdmin({
        email: 'admin@example.com',
        password: '',
        logger,
        prismaClient: prismaMock as any,
      }),
    ).rejects.toThrow('SUPER_ADMIN_PASSWORD is required.')
  })

  it('stops when a super admin already exists', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'sa-1',
      email: 'root@example.com',
      role: { name: 'SUPER_ADMIN' },
    })

    const result = await bootstrapSuperAdmin({
      email: 'target@example.com',
      password: 'StrongPass123',
      logger,
      prismaClient: prismaMock as any,
    })

    expect(result.created).toBe(false)
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('rejects a designated email already attached to another user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'target@example.com',
      role: { name: 'STUDENT' },
    })

    await expect(
      bootstrapSuperAdmin({
        email: 'target@example.com',
        password: 'StrongPass123',
        logger,
        prismaClient: prismaMock as any,
      }),
    ).rejects.toThrow('Designated super admin email already belongs to a different user account.')

    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('creates a new active super admin with the SUPER_ADMIN role', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.role.upsert.mockResolvedValue({ id: 'role-super-admin', name: 'SUPER_ADMIN' })
    prismaMock.user.create.mockResolvedValue({
      id: 'user-sa',
      email: 'super@example.com',
      roleId: 'role-super-admin',
      isActive: true,
    })

    const result = await bootstrapSuperAdmin({
      email: 'super@example.com',
      password: 'StrongPass123',
      logger,
      prismaClient: prismaMock as any,
    })

    expect(result.created).toBe(true)
    expect(result.email).toBe('super@example.com')
    expect(prismaMock.role.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'SUPER_ADMIN' },
      }),
    )
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'super@example.com',
          isActive: true,
          role: { connect: { id: 'role-super-admin' } },
        }),
      }),
    )
  })

  it('hashes the password using the existing bcrypt mechanism', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.role.upsert.mockResolvedValue({ id: 'role-super-admin', name: 'SUPER_ADMIN' })
    prismaMock.user.create.mockResolvedValue({ id: 'user-sa', email: 'super@example.com' })

    await bootstrapSuperAdmin({
      email: 'super@example.com',
      password: 'StrongPass123',
      logger,
      prismaClient: prismaMock as any,
    })

    expect(bcryptHashMock).toHaveBeenCalledWith('StrongPass123', 10)
  })

  it('never logs the password', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null)
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.role.upsert.mockResolvedValue({ id: 'role-super-admin', name: 'SUPER_ADMIN' })
    prismaMock.user.create.mockResolvedValue({ id: 'user-sa', email: 'super@example.com' })

    await bootstrapSuperAdmin({
      email: 'super@example.com',
      password: 'StrongPass123',
      logger,
      prismaClient: prismaMock as any,
    })

    const combinedLogs = logger.info.mock.calls.flat().join(' ')
    expect(combinedLogs).not.toContain('StrongPass123')
  })

  it('validates password length using the project minimum requirement', () => {
    expect(() => validateSuperAdminBootstrapInputs('super@example.com', 'short')).toThrow(
      'SUPER_ADMIN_PASSWORD must be at least 8 characters long.',
    )
  })
})
