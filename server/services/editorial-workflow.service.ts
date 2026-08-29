import { NotFoundError } from '@/auth'
import { auditRepository } from '@/server/repositories/audit.repository'
import { EditorialWorkflowRepository, type EditorialWorkflowRow, editorialWorkflowRepository } from '@/server/repositories/editorial-workflow.repository'
import { lessonRepository } from '@/server/repositories/lesson.repository'
import { questionRepository } from '@/server/repositories/question.repository'
import { publishingService } from '@/server/services/publishing.service'
import type { Prisma } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client-runtime-utils'

export type EditorialTargetType = 'QUESTION' | 'LESSON'
export type EditorialStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'

export type EditorialVersionDTO = {
  id: string
  version: number
  summary: string
  changedAt: string
  author: string
  status: EditorialStatus
  publishedAt: string | null
  isCurrent: boolean
  data?: Record<string, unknown>
}

export type EditorialReviewQueueItemDTO = {
  id: string
  prompt: string
  warnings: string[]
  status: 'pending' | 'ai-review' | 'duplicate' | 'missing-explanation'
  comments: string[]
  reviewer?: string
}

export type EditorialAuditEntryDTO = {
  id: string
  actor: string
  action: string
  timestamp: string
}

export type EditorialWorkflowDTO = {
  status: EditorialStatus
  currentVersion: number
  versions: EditorialVersionDTO[]
  reviewQueue: EditorialReviewQueueItemDTO[]
  auditTrail: EditorialAuditEntryDTO[]
  analytics: {
    reviewBacklog: number
    contentQuality: number
    coverageByModule: Array<{ module: string; coverage: number }>
    difficultyBalance: Array<{ label: string; value: number }>
  }
}

export type VersionComparisonDTO = {
  fromVersion: number
  toVersion: number
  changes: Array<{ field: string; from: string; to: string }>
}

function mapRowToDTO(row: {
  id: string
  targetType: string
  entityId: string
  status: string
  currentVersion: number
  versions: Prisma.JsonValue
  reviewQueue: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
  auditTrail?: EditorialAuditEntryDTO[]
}): EditorialWorkflowDTO {
  const versions = (row.versions as Prisma.JsonArray) ?? []
  const reviewQueue = (row.reviewQueue as Prisma.JsonArray) ?? []

  return {
    status: row.status as EditorialStatus,
    currentVersion: row.currentVersion,
    versions: versions.map((version) => {
      const v = version as Record<string, unknown>
      return {
        id: (v.id as string) ?? `${row.entityId}-v${v.version as number}`,
        version: (v.version as number) ?? 0,
        summary: (v.summary as string) ?? '',
        changedAt: (v.changedAt as string) ?? row.updatedAt.toISOString(),
        author: (v.author as string) ?? 'Unknown',
        status: (v.status as EditorialStatus) ?? row.status,
        publishedAt: (v.publishedAt as string | null) ?? null,
        isCurrent: (v.isCurrent as boolean) ?? false,
        data: (v.data as Record<string, unknown> | undefined) ?? undefined,
      }
    }),
    reviewQueue: reviewQueue.map((item) => {
      const r = item as Record<string, unknown>
      return {
        id: (r.id as string) ?? `${row.entityId}-review-${Math.random()}`,
        prompt: (r.prompt as string) ?? '',
        warnings: Array.isArray(r.warnings) ? (r.warnings as string[]) : [],
        status: (r.status as EditorialReviewQueueItemDTO['status']) ?? 'pending',
        comments: Array.isArray(r.comments) ? (r.comments as string[]) : [],
        reviewer: (r.reviewer as string | undefined) ?? undefined,
      }
    }),
    auditTrail: row.auditTrail ?? [],
    analytics: {
      reviewBacklog: reviewQueue.length,
      contentQuality: 0,
      coverageByModule: [],
      difficultyBalance: [],
    },
  }
}

function buildVersionSnapshot(
  entityId: string,
  summary: string,
  author: string,
  status: EditorialStatus,
  publishedAt: string | null,
  nextVersion: number,
  data?: Record<string, unknown>,
): Prisma.InputJsonValue {
  const snapshot: Record<string, unknown> = {
    id: `${entityId}-v${nextVersion}`,
    version: nextVersion,
    summary,
    changedAt: new Date().toISOString(),
    author,
    status,
    publishedAt,
    isCurrent: true,
  }
  if (data !== undefined) {
    snapshot.data = data
  }
  return snapshot as Prisma.InputJsonValue
}

async function recordAuditEvent(
  targetType: EditorialTargetType,
  entityId: string,
  action: string,
  actor: string,
  actorUserId?: string,
  metadata?: Record<string, unknown>,
) {
  if (!actorUserId) return

  await auditRepository.recordEvent({
    actorUserId,
    action,
    targetType,
    targetId: entityId,
    metadata: { actor, ...(metadata ?? {}) },
  })
}

async function loadAuditTrail(targetType: EditorialTargetType, entityId: string): Promise<EditorialAuditEntryDTO[]> {
  const entries = await auditRepository.listForTarget(targetType, entityId)

  return entries.map((entry) => ({
    id: entry.id,
    actor: ((entry.metadata as Record<string, unknown> | null)?.actor as string | undefined) ?? entry.actorUserId,
    action: entry.action,
    timestamp: entry.createdAt.toISOString(),
  }))
}

async function initializeWorkflow(targetType: EditorialTargetType, entityId: string): Promise<EditorialWorkflowRow> {
  let existing = await editorialWorkflowRepository.findByTarget(targetType, entityId)
  if (existing) return existing

  if (targetType === 'QUESTION') {
    const question = await questionRepository.findById(entityId)
    if (!question) throw new NotFoundError('Question not found.')
  } else {
    const lesson = await lessonRepository.findById(entityId)
    if (!lesson) throw new NotFoundError('Lesson not found.')
  }

  const initialStatus: EditorialStatus = targetType === 'QUESTION' ? 'IN_REVIEW' : 'DRAFT'
  const now = new Date().toISOString()
  const initialSnapshot = buildVersionSnapshot(entityId, `Initial ${targetType.toLowerCase()} draft created`, 'System', initialStatus, null, 1)

  try {
    return await editorialWorkflowRepository.create({
      targetType,
      entityId,
      status: initialStatus,
      currentVersion: 1,
      versions: [initialSnapshot],
      reviewQueue: [],
    })
  } catch (error: unknown) {
    const prismaError = error as { code?: string; message?: string } | null
    if (prismaError && prismaError.code === 'P2002') {
      const reloaded = await editorialWorkflowRepository.findByTarget(targetType, entityId)
      if (!reloaded) throw new Error('Workflow not found after P2002')
      return reloaded
    }
    throw error
  }
}

export async function getEditorialWorkflow(questionId: string): Promise<EditorialWorkflowDTO> {
  const row = await initializeWorkflow('QUESTION', questionId)
  const auditTrail = await loadAuditTrail('QUESTION', questionId)
  return mapRowToDTO({ ...row, auditTrail })
}

export async function getLessonEditorialWorkflow(lessonId: string): Promise<EditorialWorkflowDTO> {
  const row = await initializeWorkflow('LESSON', lessonId)
  const auditTrail = await loadAuditTrail('LESSON', lessonId)
  return mapRowToDTO({ ...row, auditTrail })
}

export async function updateEditorialStatus(
  questionId: string,
  status: EditorialStatus,
  actor = 'Editor',
  comment?: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const currentStatus = locked.status as EditorialStatus
    const validTransitions: Record<EditorialStatus, EditorialStatus[]> = {
      DRAFT: ['IN_REVIEW', 'ARCHIVED'],
      IN_REVIEW: ['APPROVED', 'DRAFT', 'PUBLISHED'],
      APPROVED: ['PUBLISHED', 'ARCHIVED', 'DRAFT'],
      PUBLISHED: ['ARCHIVED', 'DRAFT'],
      ARCHIVED: ['DRAFT'],
    }

    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${status}`)
    }

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { status, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.status.change', actor, actorUserId, { status, comment })
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function updateLessonEditorialStatus(
  lessonId: string,
  status: EditorialStatus,
  actor = 'Editor',
  comment?: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const currentStatus = locked.status as EditorialStatus
    const validTransitions: Record<EditorialStatus, EditorialStatus[]> = {
      DRAFT: ['IN_REVIEW', 'ARCHIVED'],
      IN_REVIEW: ['APPROVED', 'DRAFT', 'PUBLISHED'],
      APPROVED: ['PUBLISHED', 'ARCHIVED', 'DRAFT'],
      PUBLISHED: ['ARCHIVED', 'DRAFT'],
      ARCHIVED: ['DRAFT'],
    }

    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${status}`)
    }

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.status.change', actor, actorUserId, { status, comment })
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function addReviewComment(
  questionId: string,
  reviewId: string,
  comment: string,
  actor = 'Reviewer',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const nextQueue = reviewQueue.map((item) => {
      const r = item as Record<string, unknown>
      if (r.id !== reviewId) return item
      return {
        ...r,
        comments: [...(Array.isArray(r.comments) ? (r.comments as string[]) : []), comment],
        reviewer: actor,
      }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { reviewQueue: nextQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.review.comment', actor, actorUserId, { reviewId, comment })
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function addLessonReviewComment(
  lessonId: string,
  reviewId: string,
  comment: string,
  actor = 'Reviewer',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const nextQueue = reviewQueue.map((item) => {
      const r = item as Record<string, unknown>
      if (r.id !== reviewId) return item
      return {
        ...r,
        comments: [...(Array.isArray(r.comments) ? (r.comments as string[]) : []), comment],
        reviewer: actor,
      }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { reviewQueue: nextQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.review.comment', actor, actorUserId, { reviewId, comment })
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function assignReviewer(
  questionId: string,
  reviewId: string,
  reviewer: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const nextQueue = reviewQueue.map((item) => {
      const r = item as Record<string, unknown>
      if (r.id !== reviewId) return item
      return { ...r, reviewer }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { reviewQueue: nextQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.review.assign', reviewer, actorUserId, { reviewId })
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function assignLessonReviewer(
  lessonId: string,
  reviewId: string,
  reviewer: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const nextQueue = reviewQueue.map((item) => {
      const r = item as Record<string, unknown>
      if (r.id !== reviewId) return item
      return { ...r, reviewer }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { reviewQueue: nextQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.review.assign', reviewer, actorUserId, { reviewId })
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function bulkUpdateReviewQueue(
  questionId: string,
  reviewIds: string[],
  status: EditorialStatus,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const nextQueue = reviewQueue.map((item) => {
      const r = item as Record<string, unknown>
      if (!reviewIds.includes(r.id as string)) return item
      return { ...r, status }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { status, reviewQueue: nextQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.review.bulkUpdate', 'Admin', actorUserId, { reviewIds, status })
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function bulkUpdateLessonReviewQueue(
  lessonId: string,
  reviewIds: string[],
  status: EditorialStatus,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const nextQueue = reviewQueue.map((item) => {
      const r = item as Record<string, unknown>
      if (!reviewIds.includes(r.id as string)) return item
      return { ...r, status: 'pending' as const }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status, reviewQueue: nextQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.review.bulkUpdate', 'Admin', actorUserId, { reviewIds, status })
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function createVersionSnapshot(
  questionId: string,
  summary: string,
  author = 'Editor',
  actorUserId?: string,
): Promise<EditorialVersionDTO> {
  return createVersionSnapshotForTarget('QUESTION', questionId, summary, author, 'IN_REVIEW', null, undefined, actorUserId)
}

export async function createLessonVersionSnapshot(
  lessonId: string,
  summary: string,
  author = 'Editor',
  status: EditorialStatus = 'DRAFT',
  publishedAt: string | null = null,
  data?: Record<string, unknown>,
  actorUserId?: string,
): Promise<EditorialVersionDTO> {
  return createVersionSnapshotForTarget('LESSON', lessonId, summary, author, status, publishedAt, data, actorUserId)
}

export async function createVersionSnapshotForTarget(
  targetType: EditorialTargetType,
  entityId: string,
  summary: string,
  author: string,
  status: EditorialStatus,
  publishedAt: string | null,
  data?: Record<string, unknown>,
  actorUserId?: string,
): Promise<EditorialVersionDTO> {
  return editorialWorkflowRepository.mutateWithLock(targetType, entityId, async (tx, locked) => {
    const currentVersions = (locked.versions as Prisma.JsonArray) ?? []
    const nextVersion = currentVersions.length > 0
      ? Math.max(...currentVersions.map((v) => (v as Record<string, unknown>).version as number)) + 1
      : 1

    const snapshot = buildVersionSnapshot(entityId, summary, author, status, publishedAt, nextVersion, data)

    const nextVersions = [
      ...currentVersions.map((v) => {
        const version = v as Record<string, unknown>
        return { ...version, isCurrent: false }
      }),
      snapshot,
    ] as Prisma.InputJsonArray

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType, entityId } },
      data: {
        currentVersion: nextVersion,
        versions: nextVersions,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent(targetType, entityId, 'editorial.version.create', author, actorUserId, { version: nextVersion, status })
    const auditTrail = await loadAuditTrail(targetType, entityId)

    const dto = mapRowToDTO({ ...(updated as typeof locked), auditTrail })
    return dto.versions.find((v) => v.version === nextVersion) as EditorialVersionDTO
  })
}

export async function compareVersions(questionId: string, fromVersion: number, toVersion: number): Promise<VersionComparisonDTO> {
  const row = await initializeWorkflow('QUESTION', questionId)
  const dto = mapRowToDTO(row)
  const from = dto.versions.find((version) => version.version === fromVersion)
  const to = dto.versions.find((version) => version.version === toVersion)

  return {
    fromVersion,
    toVersion,
    changes: [
      { field: 'summary', from: from?.summary ?? 'unknown', to: to?.summary ?? 'unknown' },
      { field: 'author', from: from?.author ?? 'unknown', to: to?.author ?? 'unknown' },
    ],
  }
}

export async function restoreVersion(
  questionId: string,
  versionId: string,
  actor = 'Editor',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return restoreVersionForTarget('QUESTION', questionId, versionId, actor, actorUserId)
}

export async function restoreLessonVersion(
  lessonId: string,
  versionId: string,
  actor = 'Editor',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return restoreVersionForTarget('LESSON', lessonId, versionId, actor, actorUserId)
}

export async function restoreVersionForTarget(
  targetType: EditorialTargetType,
  entityId: string,
  versionId: string,
  actor = 'Editor',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock(targetType, entityId, async (tx, locked) => {
    const currentVersions = (locked.versions as Prisma.JsonArray) ?? []
    const version = currentVersions.find((v) => (v as Record<string, unknown>).id === versionId)
    const sourceVersion = version ? (version as Record<string, unknown>) : null

    const nextVersion = currentVersions.length > 0
      ? Math.max(...currentVersions.map((v) => (v as Record<string, unknown>).version as number)) + 1
      : 1

    const restoredSnapshot = buildVersionSnapshot(
      entityId,
      sourceVersion ? `Restored version ${sourceVersion.version as number}` : 'Restored unknown version',
      actor,
      'DRAFT',
      null,
      nextVersion,
      (sourceVersion?.data as Record<string, unknown> | undefined) ?? undefined,
    )

    const nextVersions = [...currentVersions, restoredSnapshot]

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType, entityId } },
      data: {
        status: 'DRAFT',
        currentVersion: nextVersion,
        versions: nextVersions as Prisma.InputJsonArray,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent(targetType, entityId, 'editorial.version.restore', actor, actorUserId, {
      restoredVersion: nextVersion,
      sourceVersion: sourceVersion?.version as number | undefined,
    })
    const auditTrail = await loadAuditTrail(targetType, entityId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function publishQuestion(questionId: string, actor = 'Editor', scheduledFor?: string, actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.publish('QUESTION', questionId)
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const currentVersions = (locked.versions as Prisma.JsonArray) ?? []
    const nextVersions = currentVersions.map((v) => {
      const version = v as Record<string, unknown>
      if (version.version !== locked.currentVersion) return v
      return { ...version, status: 'PUBLISHED', publishedAt: result.publishedAt }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { status: result.workflowState, versions: nextVersions, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.publish', actor, actorUserId)
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function unpublishQuestion(questionId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.unpublish('QUESTION', questionId)
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const currentVersions = (locked.versions as Prisma.JsonArray) ?? []
    const nextVersions = currentVersions.map((v) => {
      const version = v as Record<string, unknown>
      if (version.version !== locked.currentVersion) return v
      return { ...version, status: 'DRAFT', publishedAt: null }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { status: result.workflowState, versions: nextVersions, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.unpublish', actor, actorUserId)
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function publishLesson(lessonId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.publish('LESSON', lessonId)
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const currentVersions = (locked.versions as Prisma.JsonArray) ?? []
    const nextVersions = currentVersions.map((v) => {
      const version = v as Record<string, unknown>
      if (version.version !== locked.currentVersion) return v
      return { ...version, status: 'PUBLISHED', publishedAt: result.publishedAt }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status: result.workflowState, versions: nextVersions, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.publish', actor, actorUserId)
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function unpublishLesson(lessonId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.unpublish('LESSON', lessonId)
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const currentVersions = (locked.versions as Prisma.JsonArray) ?? []
    const nextVersions = currentVersions.map((v) => {
      const version = v as Record<string, unknown>
      if (version.version !== locked.currentVersion) return v
      return { ...version, status: 'DRAFT', publishedAt: null }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status: result.workflowState, versions: nextVersions, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.unpublish', actor, actorUserId)
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function submitLessonForReview(lessonId: string, actor = 'Editor', comment?: string, actorUserId?: string): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const existingPending = reviewQueue.find(
      (item) => (item as Record<string, unknown>).status === 'pending',
    )

    if (existingPending) {
      const auditTrail = await loadAuditTrail('LESSON', lessonId)
      return mapRowToDTO({ ...(locked as typeof locked), auditTrail })
    }

    const reviewItem = {
      id: `${lessonId}-review-${Date.now()}`,
      prompt: 'Lesson submitted for review',
      warnings: [] as string[],
      status: 'pending' as const,
      comments: comment ? [comment] : [],
      reviewer: undefined,
    }
    const nextQueue = [...reviewQueue, reviewItem]

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status: 'IN_REVIEW', reviewQueue: nextQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.review.submit', actor, actorUserId, { comment })
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function approveLessonReview(lessonId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.approve('LESSON', lessonId)
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const currentVersions = (locked.versions as Prisma.JsonArray) ?? []
    const nextVersions = currentVersions.map((v) => {
      const version = v as Record<string, unknown>
      if (version.version !== locked.currentVersion) return v
      return { ...version, status: 'PUBLISHED', publishedAt: result.publishedAt }
    })

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status: result.workflowState, versions: nextVersions, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.review.approve', actor, actorUserId)
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function rejectLessonReview(
  lessonId: string,
  reason: string,
  actor = 'Reviewer',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.reject('LESSON', lessonId, reason)
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status: result.workflowState, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.review.reject', actor, actorUserId, { reason })
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function sendLessonBackToDraft(
  lessonId: string,
  actor = 'Editor',
  comment?: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('LESSON', lessonId, async (tx, locked) => {
    const reviewQueue = (locked.reviewQueue as Prisma.JsonArray) ?? []
    const cleanedQueue = reviewQueue.filter(
      (item) => (item as Record<string, unknown>).status !== 'pending',
    )

    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'LESSON', entityId: lessonId } },
      data: { status: 'DRAFT', reviewQueue: cleanedQueue, updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('LESSON', lessonId, 'editorial.review.send-back', actor, actorUserId, { comment })
    const auditTrail = await loadAuditTrail('LESSON', lessonId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function archiveQuestion(questionId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { status: 'ARCHIVED', updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.archive', actor, actorUserId)
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function restoreArchivedQuestion(questionId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  return editorialWorkflowRepository.mutateWithLock('QUESTION', questionId, async (tx, locked) => {
    const updated = await tx.editorialWorkflow.update({
      where: { targetType_entityId: { targetType: 'QUESTION', entityId: questionId } },
      data: { status: 'DRAFT', updatedAt: new Date() },
      select: {
        id: true,
        targetType: true,
        entityId: true,
        status: true,
        currentVersion: true,
        versions: true,
        reviewQueue: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    await recordAuditEvent('QUESTION', questionId, 'editorial.restore', actor, actorUserId)
    const auditTrail = await loadAuditTrail('QUESTION', questionId)

    return mapRowToDTO({ ...(updated as typeof locked), auditTrail })
  })
}

export async function bulkApproveWorkflowQuestions(questionIds: string[], actor = 'Editor'): Promise<Record<string, EditorialWorkflowDTO>> {
  const result: Record<string, EditorialWorkflowDTO> = {}

  for (const questionId of questionIds) {
    result[questionId] = await updateEditorialStatus(questionId, 'APPROVED', actor, 'Bulk approved workflow')
  }

  return result
}

export async function bulkAssignReviewerToQuestions(
  questionIds: string[],
  reviewer: string,
  actorUserId?: string,
): Promise<Record<string, EditorialWorkflowDTO>> {
  const result: Record<string, EditorialWorkflowDTO> = {}
  const seen = new Set<string>()

  for (const questionId of questionIds) {
    if (seen.has(questionId)) continue
    seen.add(questionId)

    const workflow = await getEditorialWorkflow(questionId)
    const reviewQueue = (workflow.reviewQueue ?? []) as EditorialReviewQueueItemDTO[]
    const pendingItems = reviewQueue.filter((item) => item.status === 'pending')

    if (pendingItems.length === 0) {
      result[questionId] = workflow
      continue
    }

    let currentWorkflow = workflow
    for (const item of pendingItems) {
      currentWorkflow = await assignReviewer(questionId, item.id, reviewer, actorUserId)
    }
    result[questionId] = currentWorkflow
  }

  return result
}

export class EditorialWorkflowService {
  getEditorialWorkflow = getEditorialWorkflow
  getLessonEditorialWorkflow = getLessonEditorialWorkflow
  updateEditorialStatus = updateEditorialStatus
  updateLessonEditorialStatus = updateLessonEditorialStatus
  addReviewComment = addReviewComment
  addLessonReviewComment = addLessonReviewComment
  assignReviewer = assignReviewer
  assignLessonReviewer = assignLessonReviewer
  bulkUpdateReviewQueue = bulkUpdateReviewQueue
  bulkUpdateLessonReviewQueue = bulkUpdateLessonReviewQueue
  createVersionSnapshot = createVersionSnapshot
  createLessonVersionSnapshot = createLessonVersionSnapshot
  createVersionSnapshotForTarget = createVersionSnapshotForTarget
  compareVersions = compareVersions
  restoreVersion = restoreVersion
  restoreLessonVersion = restoreLessonVersion
  restoreVersionForTarget = restoreVersionForTarget
  publishQuestion = publishQuestion
  unpublishQuestion = unpublishQuestion
  publishLesson = publishLesson
  unpublishLesson = unpublishLesson
  submitLessonForReview = submitLessonForReview
  approveLessonReview = approveLessonReview
  rejectLessonReview = rejectLessonReview
  sendLessonBackToDraft = sendLessonBackToDraft
  archiveQuestion = archiveQuestion
  restoreArchivedQuestion = restoreArchivedQuestion
  bulkApproveWorkflowQuestions = bulkApproveWorkflowQuestions
  bulkAssignReviewerToQuestions = bulkAssignReviewerToQuestions
}

export const editorialWorkflowService = new EditorialWorkflowService()
