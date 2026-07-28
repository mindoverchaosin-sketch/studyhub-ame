import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('PublishingService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('supports review, approval, publication, and archival transitions for modules', async () => {
    const moduleRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'm1', status: 'DRAFT', publishedAt: null }),
      update: vi.fn().mockImplementation((_id: string, data: any) => Promise.resolve({ id: 'm1', status: data.status, publishedAt: data.publishedAt ?? null })),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { PublishingService } = await import('../../server/services/publishing.service')
    const service = new PublishingService()

    const review = await service.submitForReview('MODULE', 'm1')
    expect(review.workflowState).toBe('IN_REVIEW')
    expect(review.persistedStatus).toBe('DRAFT')

    const approved = await service.approve('MODULE', 'm1')
    expect(approved.workflowState).toBe('PUBLISHED')
    expect(approved.persistedStatus).toBe('PUBLISHED')

    const archived = await service.archive('MODULE', 'm1')
    expect(archived.workflowState).toBe('ARCHIVED')
    expect(archived.persistedStatus).toBe('ARCHIVED')
  })

  it('rejects invalid workflow transitions', async () => {
    const moduleRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'm1', status: 'DRAFT', publishedAt: null }),
      update: vi.fn().mockImplementation((_id: string, data: any) => Promise.resolve({ id: 'm1', status: data.status, publishedAt: data.publishedAt ?? null })),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { PublishingService } = await import('../../server/services/publishing.service')
    const service = new PublishingService()

    await expect(service.approve('MODULE', 'm1')).rejects.toThrow('Approval requires a pending review')
    await expect(service.publish('MODULE', 'm1')).resolves.toMatchObject({ workflowState: 'PUBLISHED' })
  })
})
