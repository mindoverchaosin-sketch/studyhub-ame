import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils'

const prismaEditorialWorkflowCreateMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowFindUniqueMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowFindManyMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowUpdateMock = vi.hoisted(() => vi.fn())
const prismaEditorialWorkflowDeleteMock = vi.hoisted(() => vi.fn())
const prismaExecuteRawMock = vi.hoisted(() => vi.fn())
const prismaTransactionMock = vi.hoisted(() => vi.fn())

const questionFindByIdMock = vi.hoisted(() => vi.fn())
const lessonFindByIdMock = vi.hoisted(() => vi.fn())

const auditRecordEventMock = vi.hoisted(() => vi.fn())
const auditListForTargetMock = vi.hoisted(() => vi.fn())

const publishingPublishMock = vi.hoisted(() => vi.fn())
const publishingUnpublishMock = vi.hoisted(() => vi.fn())
const publishingApproveMock = vi.hoisted(() => vi.fn())
const publishingRejectMock = vi.hoisted(() => vi.fn())

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

vi.mock('@/server/repositories/question.repository', () => ({
  questionRepository: {
    findById: questionFindByIdMock,
  },
}))

vi.mock('@/server/repositories/lesson.repository', () => ({
  lessonRepository: {
    findById: lessonFindByIdMock,
  },
}))

vi.mock('@/server/repositories/audit.repository', () => ({
  auditRepository: {
    recordEvent: auditRecordEventMock,
    listForTarget: auditListForTargetMock,
  },
}))

vi.mock('@/server/services/publishing.service', () => ({
  publishingService: {
    publish: publishingPublishMock,
    unpublish: publishingUnpublishMock,
    approve: publishingApproveMock,
    reject: publishingRejectMock,
  },
}))

function createMockWorkflowRow(overrides: Record<string, unknown> = {}): any {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: 'wf-1',
    targetType: 'QUESTION',
    entityId: 'q-1',
    status: 'IN_REVIEW',
    currentVersion: 1,
    versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial question draft created', author: 'System', status: 'IN_REVIEW', publishedAt: null, isCurrent: true }],
    reviewQueue: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function createMockTransactionClient(lockedRow: any, updateImpl?: any) {
  const updateFn = updateImpl ?? vi.fn().mockImplementation(async (args: any) => {
    const updated = { ...lockedRow, ...args.data, updatedAt: new Date() }
    return updated
  })
  return {
    editorialWorkflow: {
      findUnique: vi.fn().mockResolvedValue(lockedRow),
      update: updateFn,
    },
    $executeRaw: prismaExecuteRawMock,
  }
}

function resetMocks() {
  prismaEditorialWorkflowCreateMock.mockReset()
  prismaEditorialWorkflowFindUniqueMock.mockReset()
  prismaEditorialWorkflowFindManyMock.mockReset()
  prismaEditorialWorkflowUpdateMock.mockReset()
  prismaEditorialWorkflowDeleteMock.mockReset()
  prismaExecuteRawMock.mockReset()
  prismaTransactionMock.mockReset()
  questionFindByIdMock.mockReset()
  lessonFindByIdMock.mockReset()
  auditRecordEventMock.mockReset()
  auditListForTargetMock.mockReset()
  publishingPublishMock.mockReset()
  publishingUnpublishMock.mockReset()
  publishingApproveMock.mockReset()
  publishingRejectMock.mockReset()
}

beforeEach(() => {
  resetMocks()
  prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(createMockWorkflowRow())))
  questionFindByIdMock.mockResolvedValue({ id: 'q-1' })
  lessonFindByIdMock.mockResolvedValue({ id: 'l-1' })
  auditListForTargetMock.mockResolvedValue([])
  publishingPublishMock.mockResolvedValue({ workflowState: 'PUBLISHED', publishedAt: '2026-01-01T00:00:00.000Z' })
  publishingUnpublishMock.mockResolvedValue({ workflowState: 'DRAFT', publishedAt: null })
  publishingApproveMock.mockResolvedValue({ workflowState: 'PUBLISHED', publishedAt: '2026-01-01T00:00:00.000Z' })
  publishingRejectMock.mockResolvedValue({ workflowState: 'DRAFT', publishedAt: null })
})

import { EditorialWorkflowService } from '../../server/services/editorial-workflow.service'
import { EditorialWorkflowRepository } from '../../server/repositories/editorial-workflow.repository'

describe('EditorialWorkflowService', () => {
  it('creates a new question workflow with real initial snapshot and no fake data', async () => {
    const service = new EditorialWorkflowService()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue(null)
    prismaEditorialWorkflowCreateMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial question draft created', author: 'System', status: 'IN_REVIEW', publishedAt: null, isCurrent: true }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    const workflow = await service.getEditorialWorkflow('q-1')

    expect(prismaEditorialWorkflowCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetType: 'QUESTION',
          entityId: 'q-1',
          status: 'IN_REVIEW',
          currentVersion: 1,
          versions: expect.arrayContaining([
            expect.objectContaining({
              id: 'q-1-v1',
              version: 1,
              summary: 'Initial question draft created',
              isCurrent: true,
            }),
          ]),
          reviewQueue: [],
        }),
      }),
    )
    expect(workflow.status).toBe('IN_REVIEW')
    expect(workflow.currentVersion).toBe(1)
    expect(workflow.versions).toHaveLength(1)
    expect(workflow.versions[0].summary).toBe('Initial question draft created')
    expect(workflow.reviewQueue).toHaveLength(0)
    expect(workflow.auditTrail).toHaveLength(0)
    expect(workflow.analytics.contentQuality).toBe(0)
    expect(workflow.analytics.coverageByModule).toEqual([])
    expect(workflow.analytics.difficultyBalance).toEqual([])
  })

  it('creates a new lesson workflow with real initial snapshot and no fake data', async () => {
    const service = new EditorialWorkflowService()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue(null)
    prismaEditorialWorkflowCreateMock.mockResolvedValue({
      id: 'wf-2',
      targetType: 'LESSON',
      entityId: 'l-1',
      status: 'DRAFT',
      currentVersion: 1,
      versions: [{ id: 'l-1-v1', version: 1, summary: 'Initial lesson draft created', author: 'System', status: 'DRAFT', publishedAt: null, isCurrent: true }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    const workflow = await service.getLessonEditorialWorkflow('l-1')

    expect(workflow.status).toBe('DRAFT')
    expect(workflow.currentVersion).toBe(1)
    expect(workflow.versions).toHaveLength(1)
    expect(workflow.versions[0].summary).toBe('Initial lesson draft created')
    expect(workflow.reviewQueue).toHaveLength(0)
    expect(workflow.auditTrail).toHaveLength(0)
  })

  it('reloads an existing DB workflow', async () => {
    const service = new EditorialWorkflowService()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'APPROVED',
      currentVersion: 3,
      versions: [{ id: 'q-1-v3', version: 3, summary: 'Approved version', author: 'Admin', status: 'APPROVED', publishedAt: null, isCurrent: true }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    const workflow = await service.getEditorialWorkflow('q-1')

    expect(prismaEditorialWorkflowCreateMock).not.toHaveBeenCalled()
    expect(workflow.status).toBe('APPROVED')
    expect(workflow.currentVersion).toBe(3)
    expect(workflow.versions).toHaveLength(1)
  })

  it('survives state across a new service instance', async () => {
    const service1 = new EditorialWorkflowService()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue(null)
    prismaEditorialWorkflowCreateMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial', author: 'System', status: 'IN_REVIEW', publishedAt: null, isCurrent: true }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })

    await service1.getEditorialWorkflow('q-1')

    const service2 = new EditorialWorkflowService()
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial', author: 'System', status: 'IN_REVIEW', publishedAt: null, isCurrent: true }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })
    prismaEditorialWorkflowCreateMock.mockReset()

    const workflow = await service2.getEditorialWorkflow('q-1')
    expect(workflow.status).toBe('IN_REVIEW')
  })

  it('persists review queue changes', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow()
    const updateFn = vi.fn().mockImplementation(async (args: any) => {
      return {
        ...lockedRow,
        reviewQueue: [{ id: 'r-1', prompt: 'Review me', warnings: [], status: 'pending', comments: ['Comment 1'], reviewer: 'Reviewer' }],
        updatedAt: new Date(),
      }
    })
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(lockedRow, updateFn)))
    auditListForTargetMock.mockResolvedValue([])

    const workflow = await service.addReviewComment('q-1', 'r-1', 'Comment 1', 'Reviewer', 'user-1')

    expect(workflow.reviewQueue[0].comments).toContain('Comment 1')
    expect(workflow.reviewQueue[0].reviewer).toBe('Reviewer')
  })

  it('persists reviewer assignments', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow()
    const updateFn = vi.fn().mockImplementation(async (args: any) => {
      return {
        ...lockedRow,
        reviewQueue: [{ id: 'r-1', prompt: 'Review', warnings: [], status: 'pending', comments: [], reviewer: 'NewReviewer' }],
        updatedAt: new Date(),
      }
    })
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(lockedRow, updateFn)))
    auditListForTargetMock.mockResolvedValue([])

    const workflow = await service.assignReviewer('q-1', 'r-1', 'NewReviewer', 'user-1')

    expect(workflow.reviewQueue[0].reviewer).toBe('NewReviewer')
  })

  it('creates a new version and increments currentVersion', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow({ currentVersion: 1, versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial', isCurrent: true }] })
    const updateFn = vi.fn().mockImplementation(async (args: any) => {
      return {
        ...lockedRow,
        currentVersion: 2,
        versions: [
          { id: 'q-1-v1', version: 1, summary: 'Initial', isCurrent: false },
          { id: 'q-1-v2', version: 2, summary: 'Improved explanation', author: 'Editor', status: 'IN_REVIEW', publishedAt: null, isCurrent: true },
        ],
        updatedAt: new Date(),
      }
    })
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(lockedRow, updateFn)))
    auditListForTargetMock.mockResolvedValue([])

    const snapshot = await service.createVersionSnapshot('q-1', 'Improved explanation', 'Editor', 'user-1')

    expect(snapshot.version).toBe(2)
    expect(snapshot.summary).toBe('Improved explanation')
    expect(snapshot.isCurrent).toBe(true)
  })

  it('restores a version by creating a new snapshot', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow({
      currentVersion: 2,
      versions: [
        { id: 'q-1-v1', version: 1, summary: 'Initial', isCurrent: false },
        { id: 'q-1-v2', version: 2, summary: 'Improved', isCurrent: true },
      ],
    })
    const updateFn = vi.fn().mockImplementation(async (args: any) => {
      return {
        ...lockedRow,
        status: 'DRAFT',
        currentVersion: 3,
        versions: [
          { id: 'q-1-v1', version: 1, summary: 'Initial', isCurrent: false },
          { id: 'q-1-v2', version: 2, summary: 'Improved', isCurrent: false },
          { id: 'q-1-v3', version: 3, summary: 'Restored version 1', author: 'Editor', status: 'DRAFT', publishedAt: null, isCurrent: true },
        ],
        updatedAt: new Date(),
      }
    })
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(lockedRow, updateFn)))
    auditListForTargetMock.mockResolvedValue([])

    const restored = await service.restoreVersion('q-1', 'q-1-v1', 'Editor', 'user-1')

    expect(restored.status).toBe('DRAFT')
    expect(restored.currentVersion).toBe(3)
    expect(restored.versions).toHaveLength(3)
    expect(restored.versions[2].summary).toContain('Restored version')
  })

  it('compares versions from the database', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow({
      versions: [
        { id: 'q-1-v1', version: 1, summary: 'First', author: 'A', status: 'DRAFT', publishedAt: null, isCurrent: false },
        { id: 'q-1-v2', version: 2, summary: 'Second', author: 'B', status: 'IN_REVIEW', publishedAt: null, isCurrent: true },
      ],
    })
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue(lockedRow)
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(lockedRow)))

    const comparison = await service.compareVersions('q-1', 1, 2)

    expect(comparison.changes).toHaveLength(2)
    expect(comparison.changes[0].from).toBe('First')
    expect(comparison.changes[0].to).toBe('Second')
  })

  it('populates auditTrail from the AuditLog system', async () => {
    const service = new EditorialWorkflowService()
    const now = new Date('2026-01-01T00:00:00.000Z')
    prismaEditorialWorkflowFindUniqueMock.mockResolvedValue(null)
    prismaEditorialWorkflowCreateMock.mockResolvedValue({
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial', author: 'System', status: 'IN_REVIEW', publishedAt: null, isCurrent: true }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    })
    auditListForTargetMock.mockResolvedValue([
      {
        id: 'audit-1',
        actorUserId: 'user-1',
        action: 'editorial.status.change',
        targetType: 'QUESTION',
        targetId: 'q-1',
        metadata: { actor: 'Admin' },
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ])

    const workflow = await service.getEditorialWorkflow('q-1')

    expect(workflow.auditTrail).toHaveLength(1)
    expect(workflow.auditTrail[0].actor).toBe('Admin')
    expect(workflow.auditTrail[0].action).toBe('editorial.status.change')
  })

  it('returns neutral analytics and does not persist them', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow({ reviewQueue: [] })
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(lockedRow)))
    auditListForTargetMock.mockResolvedValue([])

    const workflow = await service.getEditorialWorkflow('q-1')

    expect(workflow.analytics.reviewBacklog).toBe(0)
    expect(workflow.analytics.contentQuality).toBe(0)
    expect(workflow.analytics.coverageByModule).toEqual([])
    expect(workflow.analytics.difficultyBalance).toEqual([])
  })

  it('rejects target-not-found', async () => {
    const service = new EditorialWorkflowService()
    questionFindByIdMock.mockResolvedValue(null)

    await expect(service.getEditorialWorkflow('missing-q')).rejects.toThrow('Question not found.')
  })

  it('rejects invalid status transitions', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow({ status: 'ARCHIVED' })
    const txClient = createMockTransactionClient(lockedRow)
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(txClient))

    await expect(service.updateEditorialStatus('q-1', 'DRAFT', 'Editor', undefined, 'user-1')).resolves.toBeDefined()
    await expect(service.updateEditorialStatus('q-1', 'PUBLISHED', 'Editor', undefined, 'user-1')).rejects.toThrow('Invalid transition from ARCHIVED to PUBLISHED')
  })

  it('retries on concurrent creation race', async () => {
    const service = new EditorialWorkflowService()
    const now = new Date('2026-01-01T00:00:00.000Z')
    const p2002 = new Error('Unique constraint failed')
    ;(p2002 as any).code = 'P2002'
    Object.setPrototypeOf(p2002, PrismaClientKnownRequestError.prototype)

    const existingRow = {
      id: 'wf-1',
      targetType: 'QUESTION',
      entityId: 'q-1',
      status: 'IN_REVIEW',
      currentVersion: 1,
      versions: [{ id: 'q-1-v1', version: 1, summary: 'Initial', author: 'System', status: 'IN_REVIEW', publishedAt: null, isCurrent: true }],
      reviewQueue: [],
      createdAt: now,
      updatedAt: now,
    }

    prismaEditorialWorkflowFindUniqueMock.mockResolvedValueOnce(null).mockResolvedValueOnce(existingRow)
    prismaEditorialWorkflowCreateMock.mockRejectedValueOnce(p2002).mockResolvedValueOnce(existingRow)

    const workflow = await service.getEditorialWorkflow('q-1')

    expect(workflow.status).toBe('IN_REVIEW')
    expect(prismaEditorialWorkflowCreateMock).toHaveBeenCalledTimes(1)
  })

  it('propagates persistence failures', async () => {
    const service = new EditorialWorkflowService()
    const lockedRow = createMockWorkflowRow()
    const updateFn = vi.fn().mockRejectedValue(new Error('DB connection lost'))
    prismaTransactionMock.mockImplementation(async (fn: any) => fn(createMockTransactionClient(lockedRow, updateFn)))
    auditListForTargetMock.mockResolvedValue([])

    await expect(service.updateEditorialStatus('q-1', 'APPROVED', 'Editor', undefined, 'user-1')).rejects.toThrow('DB connection lost')
  })
})

describe('EditorialWorkflowRepository', () => {
  it('is instantiable from the service test context', () => {
    const repository = new EditorialWorkflowRepository()
    expect(repository).toBeDefined()
  })
})
