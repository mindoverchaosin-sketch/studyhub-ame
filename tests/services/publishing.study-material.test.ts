import { describe, expect, it, vi } from 'vitest'

let resourceStatus = 'IN_REVIEW'
const resourceRepository = {
  findById: vi.fn().mockImplementation(async () => ({ id: 'material-1', status: resourceStatus, publishedAt: null })),
  update: vi.fn().mockImplementation(async (_id: string, data: Record<string, unknown>) => { resourceStatus = data.status as string; return { id: 'material-1', status: resourceStatus, publishedAt: data.publishedAt ?? null } }),
}
const workflowRepository = { findByTarget: vi.fn().mockResolvedValue({ status: 'APPROVED' }) }

vi.mock('@/server/repositories/resource.repository', () => ({ resourceRepository }))
vi.mock('@/server/repositories/editorial-workflow.repository', () => ({ editorialWorkflowRepository: workflowRepository }))
vi.mock('@/server/repositories/module.repository', () => ({ moduleRepository: {} }))
vi.mock('@/server/repositories/lesson.repository', () => ({ lessonRepository: {} }))
vi.mock('@/server/repositories/question.repository', () => ({ questionRepository: {} }))

describe('PublishingService study-material semantics', () => {
  it('keeps approval non-published and only publishes after approval', async () => {
    const { PublishingService } = await import('@/server/services/publishing.service')
    const service = new PublishingService()
    const approved = await service.approve('STUDY_MATERIAL', 'material-1')
    expect(approved.workflowState).toBe('APPROVED')
    expect(approved.persistedStatus).toBe('IN_REVIEW')
    expect(resourceStatus).toBe('IN_REVIEW')

    const published = await service.publish('STUDY_MATERIAL', 'material-1')
    expect(published.workflowState).toBe('PUBLISHED')
    expect(published.persistedStatus).toBe('PUBLISHED')
  })

  it('rejects publication without an approved editorial workflow', async () => {
    workflowRepository.findByTarget.mockResolvedValueOnce({ status: 'IN_REVIEW' })
    const { PublishingService } = await import('@/server/services/publishing.service')
    await expect(new PublishingService().publish('STUDY_MATERIAL', 'material-1')).rejects.toThrow('approved study material')
  })
})
