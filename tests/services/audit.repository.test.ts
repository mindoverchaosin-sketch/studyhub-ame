import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaAuditLogCreateMock = vi.hoisted(() => vi.fn())
const prismaAuditLogFindManyMock = vi.hoisted(() => vi.fn())
const prismaAuditLogCountMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      create: prismaAuditLogCreateMock,
      findMany: prismaAuditLogFindManyMock,
      count: prismaAuditLogCountMock,
    },
  },
}))

import { AuditRepository } from '../../server/repositories/audit.repository'

describe('AuditRepository', () => {
  const createAuditLogRecord = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'a-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    actorUserId: 'user-1',
    action: 'module.create',
    targetType: 'MODULE',
    targetId: 'module-1',
    metadata: { success: true, actorRole: 'ADMIN' },
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists the event with the expected Prisma shape', async () => {
    const repository = new AuditRepository()
    prismaAuditLogCreateMock.mockResolvedValue({ id: 'audit-1' })

    const result = await repository.recordEvent({
      actorUserId: 'user-1',
      action: 'module.create',
      targetType: 'MODULE',
      targetId: 'module-1',
      metadata: { success: true },
    })

    expect(prismaAuditLogCreateMock).toHaveBeenCalledWith({
      data: {
        actorUserId: 'user-1',
        action: 'module.create',
        targetType: 'MODULE',
        targetId: 'module-1',
        metadata: { success: true },
      },
    })
    expect(result).toEqual({ id: 'audit-1' })
  })

  it('supports filters and pagination for admin queries', async () => {
    const repository = new AuditRepository()
    prismaAuditLogFindManyMock.mockResolvedValue([createAuditLogRecord()])
    prismaAuditLogCountMock.mockResolvedValue(1)

    const result = await repository.listAuditLogs({
      search: 'module',
      action: 'module.create',
      entityType: 'MODULE',
      userId: 'user-1',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      page: 2,
      pageSize: 10,
    })

    expect(prismaAuditLogFindManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.any(Array),
        action: 'module.create',
        targetType: 'MODULE',
        actorUserId: 'user-1',
      }),
      skip: 10,
      take: 10,
      orderBy: { createdAt: 'desc' },
    }))
    expect(result.auditLogs).toEqual([{
      id: 'a-1',
      timestamp: '2026-01-01T00:00:00.000Z',
      userId: 'user-1',
      userRole: 'ADMIN',
      action: 'module.create',
      entityType: 'MODULE',
      entityId: 'module-1',
      status: 'SUCCESS',
      metadata: { success: true, actorRole: 'ADMIN' },
    }])
    expect(result.total).toBe(1)
  })
})
