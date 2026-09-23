import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = { workflow: 'IN_REVIEW', resourceStatus: 'IN_REVIEW' }
const resourceRepository = {
  findById: vi.fn().mockImplementation(async () => ({ id: 'material-1', status: state.resourceStatus, publishedAt: state.resourceStatus === 'PUBLISHED' ? new Date() : null, documentContent: { schemaVersion: 1, documentType: 'AEROPREP_STUDY_MATERIAL', title: 'Material', metadata: { status: 'DRAFT' }, blocks: [], branding: { systemControlled: true, locked: true } } })),
  update: vi.fn().mockImplementation(async (_id: string, data: Record<string, unknown>) => { state.resourceStatus = data.status as string ?? state.resourceStatus; return { id: 'material-1', status: state.resourceStatus, publishedAt: data.publishedAt ?? null } }),
}
const workflowRepository = { update: vi.fn().mockResolvedValue(undefined) }
const getWorkflow = vi.fn().mockImplementation(async () => ({ status: state.workflow, currentVersion: 1, versions: [], reviewQueue: [] }))
const snapshot = vi.fn().mockResolvedValue({ version: 2 })
const publishingService = {
  approve: vi.fn().mockImplementation(async () => ({ persistedStatus: 'IN_REVIEW', publishedAt: null })),
  publish: vi.fn().mockImplementation(async () => { state.resourceStatus = 'PUBLISHED'; return { persistedStatus: 'PUBLISHED', publishedAt: new Date().toISOString() } }),
  submitForReview: vi.fn(),
  archive: vi.fn(),
  unpublish: vi.fn(),
}

vi.mock('@/server/repositories/resource.repository', () => ({ resourceRepository }))
vi.mock('@/server/repositories/editorial-workflow.repository', () => ({ editorialWorkflowRepository: workflowRepository }))
vi.mock('@/server/services/editorial-workflow.service', () => ({ getStudyMaterialEditorialWorkflow: getWorkflow, createVersionSnapshotForTarget: snapshot }))
vi.mock('@/server/services/publishing.service', () => ({ publishingService }))

describe('StudyMaterialDocumentService publication gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.workflow = 'IN_REVIEW'
    state.resourceStatus = 'IN_REVIEW'
  })

  it('keeps approved material hidden until publish', async () => {
    const { StudyMaterialDocumentService } = await import('@/server/services/study-material-document.service')
    const service = new StudyMaterialDocumentService()
    await service.approve('material-1', 'Reviewer')
    expect(resourceRepository.update).toHaveBeenCalledWith('material-1', expect.objectContaining({ lastReviewedAt: expect.any(Date) }))
    expect(state.resourceStatus).toBe('IN_REVIEW')
    expect(await service.getPublishedDocument('material-1')).toBeNull()

    state.workflow = 'APPROVED'
    await service.publish('material-1', 'Publisher')
    expect(state.resourceStatus).toBe('PUBLISHED')
    expect(await service.getPublishedDocument('material-1')).not.toBeNull()
  })

  it('rejects publication while draft or review content is not approved', async () => {
    const { StudyMaterialDocumentService } = await import('@/server/services/study-material-document.service')
    const service = new StudyMaterialDocumentService()
    await expect(service.publish('material-1')).rejects.toThrow('approved study material')
    state.workflow = 'DRAFT'
    await expect(service.publish('material-1')).rejects.toThrow('approved study material')
  })
})
