import { describe, expect, it, vi, beforeEach } from 'vitest'

const prismaEditorialWorkflowCreateMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowFindUniqueMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowFindManyMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowUpdateMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowDeleteMock = vi.hoisted(() => vi.fn())
const prismaExecuteRawMock = vi.hoisted(() => vi.fn())
const prismaTransactionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/prisma', () => ({
  default: {
    editorialWorkflow: {
      create: prismaEditorialWorkflowCreateMock,
      findUnique: prismaEditorialWorkflowFindUniqueMock,
      findMany: prismaEditorialWorkflowFindManyMock,
      update: prismaEditorialWorkflowUpdateMock,
      delete: prismaEditorialWorkflowDeleteMock,
    },
    $executeRaw: prismaExecuteRawMock,
    $transaction: prismaTransactionMock,
  },
}))

import { EditorialWorkflowRepository } from '../../server/repositories/editorial-workflow.repository'

describe('EditorialWorkflowRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaTransactionMock.mockImplementation(async (fn: any) => fn({
      editorialWorkflow: {
        findUnique: prismaEditorialWorkflowFindUniqueMock,
        update: prismaEditorialWorkflowUpdateMock,
      },
      $executeRaw: prismaExecuteRawMock,
    } as any))
  })

  it('creates a workflow row', async () => {
    const repository = new EditorialWorkflowRepository()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowCreateMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial' }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    const result = await repository.create({
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial' }],
      reviewQueue: [],
    })

    expect(prismaEditorialWorkflowCreateMock).toHaveBeenCalledWith({
      data: {
        targetType: 'QUESTION',
        entityId: 'q-1',
        status: 'IN_REVIEW',
        currentVersion: 1,
        versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial' }],
        reviewQueue: [],
      },
      select: expect.any(Object),
    })
    expect(result.id).toBe('wf-1')
    expect(result.versions).toEqual([{ id: 'q-1-v1', version: 1, summary: 'Initial' }])
  })

  it('finds a workflow by target', async () => {
    const repository = new EditorialWorkflowRepository()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'LESSON',
      entityId: 'l-1',
      status: 'DRAFT',
      currentVersion: 2,
      versions: [],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    const result = await repository.findByTarget('LESSON', 'l-1')

    expect(prismaEditorialWorkflowFindUniqueMock).toHaveBeenCalledWith({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: 'l-1' } },
      select: expect.any(Object),
    })
    expect(result?.id).toBe('wf-1')
  })

  it('finds a workflow by id', async () => {
    const repository = new EditorialWorkflowRepository()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    const result = await repository.findById('wf-1')

    expect(prismaEditorialWorkflowFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 'wf-1' },
      select: expect.any(Object),
    })
    expect(result?.id).toBe('wf-1')
  })

  it('lists workflows by status', async () => {
    const repository = new EditorialWorkflowRepository()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindManyMock.mockResolvedValue([
      {
        id: 'wf-1',
        targetType: 'QUESTION',
        entityId: 'q-1',
        status: 'IN_REVIEW',
        currentVersion: 1,
        versions: [],
        reviewQueue: [],
        createdAt: now,
        updatedAt: now,
      },
    ])

    const result = await repository.listByStatus('IN_REVIEW')

    expect(prismaEditorialWorkflowFindManyMock).toHaveBeenCalledWith({
      where: { status: 'IN_REVIEW' },
      orderBy: { updatedAt: 'desc' },
      select: expect.any(Object),
    })
    expect(result).toHaveLength(1)
  })

  it('updates a workflow row', async () => {
    const repository = new EditorialWorkflowRepository()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowUpdateMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'APPROVED',
      currentVersion: 1,
      versions: [],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    const result = await repository.update('QUESTION', 'q-1', { status: 'APPROVED' })

    expect(prismaEditorialWorkflowUpdateMock).toHaveBeenCalledWith({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: 'q-1' } },
      data: { status: 'APPROVED' },
      select: expect.any(Object),
    })
    expect(result.status).toBe('APPROVED')
  })

  it('deletes a workflow by id', async () => {
    const repository = new EditorialWorkflowRepository()
    prismaEditorialWorkflowDeleteMock.mockResolvedValue({})

    await repository.delete('wf-1')

    expect(prismaEditorialWorkflowDeleteMock).toHaveBeenCalledWith({ where: { id: 'wf-1' } })
  })

  it('deletes a workflow by target', async () => {
    const repository = new EditorialWorkflowRepository()
    prismaEditorialWorkflowDeleteMock.mockResolvedValue({})

    await repository.deleteByTarget('QUESTION', 'q-1')

    expect(prismaEditorialWorkflowDeleteMock).toHaveBeenCalledWith({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: 'q-1' } },
    })
  })

  it('maps JSON columns safely', async () => {
    const repository = new EditorialWorkflowRepository()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ version: 1, summary: 'Initial', isCurrent: true }],
      reviewQueue: [{ id: 'r-1', prompt: 'Review', status: 'pending', comments: [] }],
      createdAt: now,
      updatedAt: now,
    })

    const result = await repository.findByTarget('QUESTION', 'q-1')

    expect(result?.versions).toEqual([{ version: 1, summary: 'Initial', isCurrent: true }])
    expect(result?.reviewQueue).toEqual([{ id: 'r-1', prompt: 'Review', status: 'pending', comments: [] }])
  })

  it('acquires a FOR UPDATE lock inside a transaction', async () => {
    const repository = new EditorialWorkflowRepository()
    prismaExecuteRawMock.mockResolvedValue([])
    prismaTransactionMock.mockImplementation(async (fn: any) => fn({
      editorialWorkflow: {
        findUnique: prismaEditorialWorkflowFindUniqueMock,
        update: prismaEditorialWorkflowUpdateMock,
      },
      $executeRaw: prismaExecuteRawMock,
    } as any))
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [],
      reviewQueue: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await repository.mutateWithLock('QUESTION', 'q-1', async () => 'done')

    expect(prismaTransactionMock).toHaveBeenCalled()
    const executeRawCalls = prismaExecuteRawMock.mock.calls
    expect(executeRawCalls.length).toBeGreaterThan(0)
    const firstCall = executeRawCalls[0] as unknown as [string, ...unknown[]]
    expect(firstCall[0]).toBeDefined()
    expect(String(firstCall[0])).toContain('FOR UPDATE')
    expect(firstCall[1]).toBe('QUESTION')
    expect(firstCall[2]).toBe('q-1')
  })
})
