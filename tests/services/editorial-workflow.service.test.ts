import { describe, expect, it } from 'vitest'

describe('editorial-workflow.service', () => {
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
})
