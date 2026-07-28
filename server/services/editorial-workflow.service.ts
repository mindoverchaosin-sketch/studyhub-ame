export type EditorialStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED'

export type EditorialVersionDTO = {
  id: string
  version: number
  summary: string
  changedAt: string
  author: string
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

function createBaseWorkflow(questionId: string): EditorialWorkflowDTO {
  return {
    status: 'IN_REVIEW',
    versions: [
      { id: `${questionId}-v1`, version: 1, summary: 'Initial draft created', changedAt: new Date('2024-01-10T10:00:00.000Z').toISOString(), author: 'Admin' },
      { id: `${questionId}-v2`, version: 2, summary: 'Refined explanation and distractors', changedAt: new Date('2024-01-11T10:00:00.000Z').toISOString(), author: 'Reviewer' },
    ],
    reviewQueue: [
      { id: `${questionId}-review-1`, prompt: 'Question needs review', warnings: ['Duplicate warning', 'Missing explanation'], status: 'duplicate', comments: ['Needs clearer distractor wording'], reviewer: undefined },
      { id: `${questionId}-review-2`, prompt: 'AI review suggestion', warnings: ['Ambiguous wording'], status: 'ai-review', comments: [], reviewer: undefined },
    ],
    auditTrail: [
      { id: `${questionId}-audit-1`, actor: 'Author', action: 'Drafted question', timestamp: new Date('2024-01-10T10:00:00.000Z').toISOString() },
      { id: `${questionId}-audit-2`, actor: 'Reviewer', action: 'Approved changes', timestamp: new Date('2024-01-11T10:00:00.000Z').toISOString() },
    ],
    analytics: {
      reviewBacklog: 2,
      contentQuality: 88,
      coverageByModule: [{ module: 'Airframes', coverage: 92 }, { module: 'Systems', coverage: 78 }],
      difficultyBalance: [{ label: 'Beginner', value: 40 }, { label: 'Intermediate', value: 40 }, { label: 'Advanced', value: 20 }],
    },
  }
}

function getOrCreateWorkflow(questionId: string): EditorialWorkflowDTO {
  const existing = workflowStore.get(questionId)
  if (existing) return existing

  const workflow = createBaseWorkflow(questionId)
  workflowStore.set(questionId, workflow)
  return workflow
}

export async function getEditorialWorkflow(questionId: string): Promise<EditorialWorkflowDTO> {
  return structuredClone(getOrCreateWorkflow(questionId))
}

export async function updateEditorialStatus(questionId: string, status: EditorialStatus, actor = 'Editor', comment?: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  workflow.status = status
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Changed status to ${status}${comment ? ` (${comment})` : ''}`, timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function addReviewComment(questionId: string, reviewId: string, comment: string, actor = 'Reviewer'): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  const item = workflow.reviewQueue.find((entry) => entry.id === reviewId)
  if (item) {
    item.comments = [...item.comments, comment]
    item.reviewer = actor
  }
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: `Added review comment to ${reviewId}`, timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function assignReviewer(questionId: string, reviewId: string, reviewer: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  const item = workflow.reviewQueue.find((entry) => entry.id === reviewId)
  if (item) {
    item.reviewer = reviewer
  }
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: reviewer, action: `Assigned reviewer to ${reviewId}`, timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function bulkUpdateReviewQueue(questionId: string, reviewIds: string[], status: EditorialStatus): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  workflow.status = status
  workflow.reviewQueue = workflow.reviewQueue.map((item) => (reviewIds.includes(item.id) ? { ...item, status: 'pending' } : item))
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: 'Admin', action: `Bulk updated ${reviewIds.length} review items`, timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function createVersionSnapshot(questionId: string, summary: string, author = 'Editor'): Promise<EditorialVersionDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  const nextVersion = Math.max(...workflow.versions.map((version) => version.version), 0) + 1
  const snapshot: EditorialVersionDTO = {
    id: `${questionId}-v${nextVersion}`,
    version: nextVersion,
    summary,
    changedAt: new Date().toISOString(),
    author,
  }
  workflow.versions = [...workflow.versions, snapshot]
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: author, action: `Created version ${nextVersion}`, timestamp: new Date().toISOString() },
  ]
  return structuredClone(snapshot)
}

export async function compareVersions(questionId: string, fromVersion: number, toVersion: number): Promise<VersionComparisonDTO> {
  const workflow = getOrCreateWorkflow(questionId)
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

export async function restoreVersion(questionId: string, versionId: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  const version = workflow.versions.find((entry) => entry.id === versionId)
  workflow.status = 'DRAFT'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: 'Editor', action: `Restored version ${version?.version ?? 'unknown'}`, timestamp: new Date().toISOString() },
  ]
  workflow.versions = workflow.versions.map((entry) => (entry.id === versionId ? { ...entry, summary: `${entry.summary} (restored)` } : entry))
  return structuredClone(workflow)
}

export async function publishQuestion(questionId: string, actor = 'Editor', scheduledFor?: string): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  workflow.status = scheduledFor ? 'IN_REVIEW' : 'PUBLISHED'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: scheduledFor ? `Scheduled publish for ${scheduledFor}` : 'Published question', timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function unpublishQuestion(questionId: string, actor = 'Editor'): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  workflow.status = 'DRAFT'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Unpublished question', timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function archiveQuestion(questionId: string, actor = 'Editor'): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
  workflow.status = 'ARCHIVED'
  workflow.auditTrail = [
    ...workflow.auditTrail,
    { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor, action: 'Archived question', timestamp: new Date().toISOString() },
  ]
  return structuredClone(workflow)
}

export async function restoreArchivedQuestion(questionId: string, actor = 'Editor'): Promise<EditorialWorkflowDTO> {
  const workflow = getOrCreateWorkflow(questionId)
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
    const workflow = getOrCreateWorkflow(questionId)
    workflow.auditTrail = [
      ...workflow.auditTrail,
      { id: `${questionId}-audit-${workflow.auditTrail.length + 1}`, actor: reviewer, action: `Assigned reviewer ${reviewer} to question`, timestamp: new Date().toISOString() },
    ]
    result[questionId] = structuredClone(workflow)
  }

  return result
}
