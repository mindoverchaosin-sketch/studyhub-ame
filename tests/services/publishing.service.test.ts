import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('PublishingService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('persists review, approval, publication, and archival transitions in entity status', async () => {
    let currentStatus = 'DRAFT'
    const moduleRepository = {
      findById: vi.fn().mockImplementation(() => Promise.resolve({ id: 'm1', status: currentStatus, publishedAt: currentStatus === 'PUBLISHED' ? new Date().toISOString() : null })),
      update: vi.fn().mockImplementation((_id: string, data: any) => {
        currentStatus = data.status
        return Promise.resolve({ id: 'm1', status: data.status, publishedAt: data.publishedAt ?? null })
      }),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { PublishingService } = await import('../../server/services/publishing.service')
    const service = new PublishingService()

    const review = await service.submitForReview('MODULE', 'm1')
    expect(review.workflowState).toBe('IN_REVIEW')
    expect(review.persistedStatus).toBe('IN_REVIEW')
    expect(moduleRepository.update).toHaveBeenLastCalledWith('m1', expect.objectContaining({ status: 'IN_REVIEW' }))

    const approved = await service.approve('MODULE', 'm1')
    expect(approved.workflowState).toBe('PUBLISHED')
    expect(approved.persistedStatus).toBe('PUBLISHED')
    expect(moduleRepository.update).toHaveBeenLastCalledWith('m1', expect.objectContaining({ status: 'PUBLISHED' }))

    const archived = await service.archive('MODULE', 'm1')
    expect(archived.workflowState).toBe('ARCHIVED')
    expect(archived.persistedStatus).toBe('ARCHIVED')
    expect(moduleRepository.update).toHaveBeenLastCalledWith('m1', expect.objectContaining({ status: 'ARCHIVED' }))
  })

  it('reads persisted IN_REVIEW state from the entity on a new service instance', async () => {
    const moduleRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'm1', status: 'IN_REVIEW', publishedAt: null }),
      update: vi.fn().mockImplementation((_id: string, data: any) => Promise.resolve({ id: 'm1', status: data.status, publishedAt: data.publishedAt ?? null })),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { PublishingService } = await import('../../server/services/publishing.service')
    const service = new PublishingService()

    const approved = await service.approve('MODULE', 'm1')
    expect(approved.workflowState).toBe('PUBLISHED')
    expect(approved.persistedStatus).toBe('PUBLISHED')
    expect(moduleRepository.update).toHaveBeenLastCalledWith('m1', expect.objectContaining({ status: 'PUBLISHED' }))
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
    await expect(service.reject('MODULE', 'm1')).rejects.toThrow('Rejection requires a pending review')
    await expect(service.publish('MODULE', 'm1')).resolves.toMatchObject({ workflowState: 'PUBLISHED', persistedStatus: 'PUBLISHED' })
  })

  it('preserves publish and unpublish transitions', async () => {
    const moduleRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'm1', status: 'DRAFT', publishedAt: null }),
      update: vi.fn().mockImplementation((_id: string, data: any) => Promise.resolve({ id: 'm1', status: data.status, publishedAt: data.publishedAt ?? null })),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { PublishingService } = await import('../../server/services/publishing.service')
    const service = new PublishingService()

    const published = await service.publish('MODULE', 'm1')
    expect(published.workflowState).toBe('PUBLISHED')
    expect(published.persistedStatus).toBe('PUBLISHED')
    expect(moduleRepository.update).toHaveBeenLastCalledWith('m1', expect.objectContaining({ status: 'PUBLISHED' }))

    const unpublished = await service.unpublish('MODULE', 'm1')
    expect(unpublished.workflowState).toBe('DRAFT')
    expect(unpublished.persistedStatus).toBe('DRAFT')
    expect(moduleRepository.update).toHaveBeenLastCalledWith('m1', expect.objectContaining({ status: 'DRAFT' }))
  })
})
