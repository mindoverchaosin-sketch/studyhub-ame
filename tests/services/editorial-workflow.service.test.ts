import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('editorial-workflow.service', () => {
  beforeEach(() => {
    vi.resetModules()
  })
  it('returns workflow, versions, review queue, audit trail and analytics', async () => {
    const { getEditorialWorkflow, createVersionSnapshot } = await import('../../server/services/editorial-workflow.service')

    const workflow = await getEditorialWorkflow('q1')
    const snapshot = await createVersionSnapshot('q1', 'Improved explanation')

    expect(workflow.status).toBe('IN_REVIEW')
    expect(workflow.versions.length).toBeGreaterThan(0)
    expect(workflow.reviewQueue[0].warnings.length).toBeGreaterThan(0)
    expect(workflow.auditTrail[0].action).toContain('Drafted')
    expect(workflow.analytics.reviewBacklog).toBeGreaterThan(0)
    expect(snapshot.summary).toContain('Improved')
  })

  it('updates workflow status and adds review comments', async () => {
    const { updateEditorialStatus, addReviewComment } = await import('../../server/services/editorial-workflow.service')

    const approved = await updateEditorialStatus('q1', 'APPROVED', 'reviewer-1', 'Looks good')
    const reviewed = await addReviewComment('q1', approved.reviewQueue[0].id, 'Needs clearer explanation', 'reviewer-1')

    expect(approved.status).toBe('APPROVED')
    expect(reviewed.reviewQueue[0].comments).toContain('Needs clearer explanation')
    expect(reviewed.auditTrail[reviewed.auditTrail.length - 1].action).toContain('comment')
  })

  it('compares versions and restores a previous snapshot', async () => {
    const { compareVersions, restoreVersion } = await import('../../server/services/editorial-workflow.service')

    const comparison = await compareVersions('q1', 1, 2)
    const restored = await restoreVersion('q1', 'q1-v1')

    expect(comparison.changes.length).toBeGreaterThan(0)
    expect(restored.versions.some((version) => version.version === 1)).toBe(true)
    expect(restored.status).toBe('DRAFT')
  })

  it('tracks lesson version history, publishes, and restores a lesson workflow', async () => {
    vi.resetModules()

    const auditRepository = { recordEvent: vi.fn().mockResolvedValue({}) }
    const publishingService = {
      publish: vi.fn().mockResolvedValue({ workflowState: 'PUBLISHED', publishedAt: new Date().toISOString() }),
      unpublish: vi.fn().mockResolvedValue({ workflowState: 'DRAFT', publishedAt: null }),
    }

    vi.doMock('@/server/repositories/audit.repository', () => ({ auditRepository }))
    vi.doMock('@/server/services/publishing.service', () => ({ publishingService }))

    const {
      getLessonEditorialWorkflow,
      createLessonVersionSnapshot,
      publishLesson,
      unpublishLesson,
      restoreLessonVersion,
    } = await import('../../server/services/editorial-workflow.service')

    const initialWorkflow = await getLessonEditorialWorkflow('lesson-1')
    expect(initialWorkflow.status).toBe('DRAFT')
    expect(initialWorkflow.versions.length).toBe(1)
    expect(initialWorkflow.currentVersion).toBe(1)

    const snapshot = await createLessonVersionSnapshot('lesson-1', 'Added additional explanations', 'Editor', 'DRAFT', null, {
      title: 'Lesson 1',
      content: 'Updated content',
    })
    expect(snapshot.version).toBe(2)
    expect(snapshot.isCurrent).toBe(true)

    const publishedWorkflow = await publishLesson('lesson-1', 'Editor')
    expect(publishedWorkflow.status).toBe('PUBLISHED')
    expect(publishedWorkflow.versions.find((version) => version.version === 2)?.status).toBe('PUBLISHED')
    expect(publishedWorkflow.versions.find((version) => version.version === 2)?.publishedAt).not.toBeNull()

    const unpublishedWorkflow = await unpublishLesson('lesson-1', 'Editor')
    expect(unpublishedWorkflow.status).toBe('DRAFT')
    expect(unpublishedWorkflow.versions.find((version) => version.version === 2)?.status).toBe('DRAFT')

    const restored = await restoreLessonVersion('lesson-1', 'lesson-1-v1', 'Editor')
    expect(restored.status).toBe('DRAFT')
    expect(restored.currentVersion).toBe(3)
    expect(restored.versions[restored.versions.length - 1].summary).toContain('Restored version')
  })

  it('supports lesson review queue approval, rejection, and send-back-to-draft transitions', async () => {
    vi.resetModules()

    const auditRepository = { recordEvent: vi.fn().mockResolvedValue({}) }
    const publishingService = {
      approve: vi.fn().mockResolvedValue({ workflowState: 'PUBLISHED', publishedAt: new Date().toISOString() }),
      reject: vi.fn().mockResolvedValue({ workflowState: 'DRAFT', publishedAt: null }),
    }

    vi.doMock('@/server/repositories/audit.repository', () => ({ auditRepository }))
    vi.doMock('@/server/services/publishing.service', () => ({ publishingService }))

    const {
      submitLessonForReview,
      approveLessonReview,
      rejectLessonReview,
      sendLessonBackToDraft,
    } = await import('../../server/services/editorial-workflow.service')

    const submitted = await submitLessonForReview('lesson-2', 'Editor', 'Please review the new content')
    expect(submitted.status).toBe('IN_REVIEW')
    expect(submitted.reviewQueue.some((item) => item.prompt === 'Lesson submitted for review')).toBe(true)

    const approved = await approveLessonReview('lesson-2', 'Editor')
    expect(approved.status).toBe('PUBLISHED')

    const rejected = await rejectLessonReview('lesson-2', 'Needs more detail', 'Reviewer')
    expect(rejected.status).toBe('DRAFT')

    const sentBack = await sendLessonBackToDraft('lesson-2', 'Editor', 'Needs revision')
    expect(sentBack.status).toBe('DRAFT')
  })
})
