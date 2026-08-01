import { auditRepository } from '@/server/repositories/audit.repository'
import { publishingService } from '@/server/services/publishing.service'

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

const workflowStore = new Map<string, EditorialWorkflowDTO>()

function getWorkflowKey(targetType: EditorialTargetType, entityId: string) {
  return `${targetType}:${entityId}`
}

function createBaseWorkflow(entityId: string, targetType: EditorialTargetType): EditorialWorkflowDTO {
  const initialStatus: EditorialStatus = targetType === 'QUESTION' ? 'IN_REVIEW' : 'DRAFT'
  return {
    status: initialStatus,
    currentVersion: 1,
    versions: [
      {
        id: `${entityId}-v1`,
        version: 1,
        summary: targetType === 'QUESTION' ? 'Initial question draft created' : 'Initial lesson draft created',
        changedAt: new Date('2024-01-10T10:00:00.000Z').toISOString(),
        author: 'Admin',
        status: initialStatus,
        publishedAt: null,
        isCurrent: true,
      },
    ],
    reviewQueue: targetType === 'QUESTION'
      ? [
          { id: `${entityId}-review-1`, prompt: 'Question needs review', warnings: ['Duplicate warning', 'Missing explanation'], status: 'duplicate', comments: ['Needs clearer distractor wording'], reviewer: undefined },
          { id: `${entityId}-review-2`, prompt: 'AI review suggestion', warnings: ['Ambiguous wording'], status: 'ai-review', comments: [], reviewer: undefined },
        ]
      : [
          { id: `${entityId}-review-1`, prompt: 'Lesson ready for editorial review', warnings: [], status: 'pending', comments: [], reviewer: undefined },
        ],
    auditTrail: [
      { id: `${entityId}-audit-1`, actor: 'Author', action: targetType === 'QUESTION' ? 'Drafted question' : 'Drafted lesson', timestamp: new Date('2024-01-10T10:00:00.000Z').toISOString() },
    ],
    analytics: {
      reviewBacklog: 1,
      contentQuality: 90,
      coverageByModule: [{ module: 'Airframes', coverage: 92 }, { module: 'Systems', coverage: 78 }],
      difficultyBalance: [{ label: 'Beginner', value: 40 }, { label: 'Intermediate', value: 40 }, { label: 'Advanced', value: 20 }],
    },
  }
}

function getOrCreateWorkflow(targetType: EditorialTargetType, entityId: string): EditorialWorkflowDTO {
  const key = getWorkflowKey(targetType, entityId)
  const existing = workflowStore.get(key)
  if (existing) return existing

  const workflow = createBaseWorkflow(entityId, targetType)
  workflowStore.set(key, workflow)
  return workflow
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

function createVersionSnapshotInternal(
  workflow: EditorialWorkflowDTO,
  entityId: string,
  targetType: EditorialTargetType,
  summary: string,
  author: string,
  status: EditorialStatus,
  publishedAt: string | null,
  data?: Record<string, unknown>,
): EditorialVersionDTO {
  const nextVersion = Math.max(...workflow.versions.map((version) => version.version), 0) + 1
  const snapshot: EditorialVersionDTO = {
    id: `${entityId}-v${nextVersion}`,
    version: nextVersion,
    summary,
    changedAt: new Date().toISOString(),
    author,
    status,
    publishedAt,
    isCurrent: true,
    data,
  }

  workflow.versions = workflow.versions.map((version) => ({ ...version, isCurrent: false }))
  workflow.versions = [...workflow.versions, snapshot]
  workflow.currentVersion = nextVersion
  return snapshot
}

export async function getEditorialWorkflow(questionId: string): Promise<EditorialWorkflowDTO> {
  return structuredClone(getOrCreateWorkflow('QUESTION', questionId))
}

export async function getLessonEditorialWorkflow(lessonId: string): Promise<EditorialWorkflowDTO> {
  return structuredClone(getOrCreateWorkflow('LESSON', lessonId))
}

export async function updateEditorialStatus(
  questionId: string,
  status: EditorialStatus,
  actor = 'Editor',
  comment?: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  workflow.status = status
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Changed status to ${status}${comment ? ` (${comment})` : ''}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('QUESTION', questionId, 'editorial.status.change', actor, actorUserId, { status, comment })
  return structuredClone(workflow)
}

export async function updateLessonEditorialStatus(
  lessonId: string,
  status: EditorialStatus,
  actor = 'Editor',
  comment?: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = status
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Changed status to ${status}${comment ? ` (${comment})` : ''}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('LESSON', lessonId, 'editorial.status.change', actor, actorUserId, { status, comment })
  return structuredClone(workflow)
}

export async function addReviewComment(
  questionId: string,
  reviewId: string,
  comment: string,
  actor = 'Reviewer',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  const item = workflow.reviewQueue.find((entry) => entry.id === reviewId)
  if (item) {
    item.comments = [...item.comments, comment]
    item.reviewer = actor
  }
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Added review comment to ${reviewId}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('QUESTION', questionId, 'editorial.review.comment', actor, actorUserId, { reviewId, comment })
  return structuredClone(workflow)
}

export async function addLessonReviewComment(
  lessonId: string,
  reviewId: string,
  comment: string,
  actor = 'Reviewer',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  const item = workflow.reviewQueue.find((entry) => entry.id === reviewId)
  if (item) {
    item.comments = [...item.comments, comment]
    item.reviewer = actor
  }
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Added review comment to ${reviewId}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('LESSON', lessonId, 'editorial.review.comment', actor, actorUserId, { reviewId, comment })
  return structuredClone(workflow)
}

export async function assignReviewer(questionId: string, reviewId: string, reviewer: string, actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  const item = workflow.reviewQueue.find((entry) => entry.id === reviewId)
  if (item) {
    item.reviewer = reviewer
  }
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: reviewer, action: `Assigned reviewer to ${reviewId}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('QUESTION', questionId, 'editorial.review.assign', reviewer, actorUserId, { reviewId })
  return structuredClone(workflow)
}

export async function assignLessonReviewer(lessonId: string, reviewId: string, reviewer: string, actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  const item = workflow.reviewQueue.find((entry) => entry.id === reviewId)
  if (item) {
    item.reviewer = reviewer
  }
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor: reviewer, action: `Assigned reviewer to ${reviewId}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('LESSON', lessonId, 'editorial.review.assign', reviewer, actorUserId, { reviewId })
  return structuredClone(workflow)
}

export async function bulkUpdateReviewQueue(questionId: string, reviewIds: string[], status: EditorialStatus): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  workflow.status = status
  workflow.reviewQueue = workflow.reviewQueue.map((item) => (reviewIds.includes(item.id) ? { ...item, status: 'pending' } : item))
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: 'Admin', action: `Bulk updated ${reviewIds.length} review items`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('QUESTION', questionId, 'editorial.review.bulkUpdate', 'Admin', undefined, { reviewIds, status })
  return structuredClone(workflow)
}

export async function bulkUpdateLessonReviewQueue(lessonId: string, reviewIds: string[], status: EditorialStatus, actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = status
  workflow.reviewQueue = workflow.reviewQueue.map((item) => (reviewIds.includes(item.id) ? { ...item, status: 'pending' } : item))
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor: 'Admin', action: `Bulk updated ${reviewIds.length} review items`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('LESSON', lessonId, 'editorial.review.bulkUpdate', 'Admin', actorUserId, { reviewIds, status })
  return structuredClone(workflow)
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
  const workflow = getOrCreateWorkflow(targetType, entityId)
  const snapshot = createVersionSnapshotInternal(workflow, entityId, targetType, summary, author, status, publishedAt, data)
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${entityId}-audit-${workflow.auditTrail.length + 1}`, actor: author, action: `Created version ${snapshot.version}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent(targetType, entityId, 'editorial.version.create', author, actorUserId, { version: snapshot.version, status })
  return structuredClone(snapshot)
}

export async function compareVersions(questionId: string, fromVersion: number, toVersion: number): Promise<VersionComparisonDTO> {
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  const from = workflow.versions.find((version) => version.version === fromVersion)
  const to = workflow.versions.find((version) => version.version === toVersion)

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
  const workflow = getOrCreateWorkflow(targetType, entityId)
  const version = workflow.versions.find((entry) => entry.id === versionId)
  const restoredVersion = version
    ? createVersionSnapshotInternal(workflow, entityId, targetType, `Restored version ${version.version}`, actor, 'DRAFT', null, version.data)
    : createVersionSnapshotInternal(workflow, entityId, targetType, 'Restored unknown version', actor, 'DRAFT', null, undefined)

  workflow.status = 'DRAFT'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${entityId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Restored version ${version?.version ?? 'unknown'}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent(targetType, entityId, 'editorial.version.restore', actor, actorUserId, { restoredVersion: restoredVersion.version, sourceVersion: version?.version })
  return structuredClone(workflow)
}

export async function publishQuestion(questionId: string, actor = 'Editor', scheduledFor?: string, actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.publish('QUESTION', questionId)
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  workflow.status = result.workflowState
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Published question', timestamp: new Date().toISOString() },
  ]
  const currentVersion = workflow.versions.find((version) => version.version === workflow.currentVersion)
  if (currentVersion) {
    currentVersion.status = 'PUBLISHED'
    currentVersion.publishedAt = result.publishedAt
  }
  await recordAuditEvent('QUESTION', questionId, 'editorial.publish', actor, actorUserId)
  return structuredClone(workflow)
}

export async function unpublishQuestion(questionId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.unpublish('QUESTION', questionId)
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  workflow.status = result.workflowState
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Unpublished question', timestamp: new Date().toISOString() },
  ]
  const currentVersion = workflow.versions.find((version) => version.version === workflow.currentVersion)
  if (currentVersion) {
    currentVersion.status = 'DRAFT'
    currentVersion.publishedAt = null
  }
  await recordAuditEvent('QUESTION', questionId, 'editorial.unpublish', actor, actorUserId)
  return structuredClone(workflow)
}

export async function publishLesson(lessonId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.publish('LESSON', lessonId)
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = result.workflowState
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Published lesson', timestamp: new Date().toISOString() },
  ]
  const currentVersion = workflow.versions.find((version) => version.version === workflow.currentVersion)
  if (currentVersion) {
    currentVersion.status = 'PUBLISHED'
    currentVersion.publishedAt = result.publishedAt
  }
  await recordAuditEvent('LESSON', lessonId, 'editorial.publish', actor, actorUserId)
  return structuredClone(workflow)
}

export async function unpublishLesson(lessonId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.unpublish('LESSON', lessonId)
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = result.workflowState
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Unpublished lesson', timestamp: new Date().toISOString() },
  ]
  const currentVersion = workflow.versions.find((version) => version.version === workflow.currentVersion)
  if (currentVersion) {
    currentVersion.status = 'DRAFT'
    currentVersion.publishedAt = null
  }
  await recordAuditEvent('LESSON', lessonId, 'editorial.unpublish', actor, actorUserId)
  return structuredClone(workflow)
}

export async function submitLessonForReview(lessonId: string, actor = 'Editor', comment?: string, actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = 'IN_REVIEW'
  const reviewItem = {
    id: `${lessonId}-review-${workflow.reviewQueue.length + 1}`,
    prompt: 'Lesson submitted for review',
    warnings: [],
    status: 'pending' as const,
    comments: comment ? [comment] : [],
    reviewer: undefined,
  }
  workflow.reviewQueue = [...workflow.reviewQueue, reviewItem]
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Submitted lesson for review${comment ? ` (${comment})` : ''}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('LESSON', lessonId, 'editorial.review.submit', actor, actorUserId, { comment })
  return structuredClone(workflow)
}

export async function approveLessonReview(lessonId: string, actor = 'Editor', actorUserId?: string): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.approve('LESSON', lessonId)
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = result.workflowState
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Approved lesson review', timestamp: new Date().toISOString() },
  ]
  const currentVersion = workflow.versions.find((version) => version.version === workflow.currentVersion)
  if (currentVersion) {
    currentVersion.status = 'PUBLISHED'
    currentVersion.publishedAt = result.publishedAt
  }
  await recordAuditEvent('LESSON', lessonId, 'editorial.review.approve', actor, actorUserId)
  return structuredClone(workflow)
}

export async function rejectLessonReview(
  lessonId: string,
  reason: string,
  actor = 'Reviewer',
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  const result = await publishingService.reject('LESSON', lessonId, reason)
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = result.workflowState
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Rejected lesson review (${reason})`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('LESSON', lessonId, 'editorial.review.reject', actor, actorUserId, { reason })
  return structuredClone(workflow)
}

export async function sendLessonBackToDraft(
  lessonId: string,
  actor = 'Editor',
  comment?: string,
  actorUserId?: string,
): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('LESSON', lessonId)
  workflow.status = 'DRAFT'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${lessonId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Sent lesson back to draft${comment ? ` (${comment})` : ''}`, timestamp: new Date().toISOString() },
  ]
  await recordAuditEvent('LESSON', lessonId, 'editorial.review.send-back', actor, actorUserId, { comment })
  return structuredClone(workflow)
}

export async function archiveQuestion(questionId: string, actor = 'Editor'): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  workflow.status = 'ARCHIVED'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Archived question', timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function restoreArchivedQuestion(questionId: string, actor = 'Editor'): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow('QUESTION', questionId)
  workflow.status = 'DRAFT'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Restored archived question', timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function bulkApproveWorkflowQuestions(questionIds: string[], actor = 'Editor'): Promise<Record<string, EditorialWorkflowDTO>> {
  const result: Record<string, EditorialWorkflowDTO> = {}

  for (const questionId of questionIds) {
    result[questionId] = await updateEditorialStatus(questionId, 'APPROVED', actor, 'Bulk approved workflow')
  }

  return result
}

export async function bulkAssignReviewerToQuestions(questionIds: string[], reviewer: string): Promise<Record<string, EditorialWorkflowDTO>> {
  const result: Record<string, EditorialWorkflowDTO> = {}

  for (const questionId of questionIds) {
    const workflow = getOrCreateWorkflow('QUESTION', questionId)
    workflow.auditTrail = [
      ...workflow.auditTrail,
      { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: reviewer, action: `Assigned reviewer ${reviewer} to question`, timestamp: new Date().toISOString() },
    ]
    result[questionId] = structuredClone(workflow)
  }

  return result
}
