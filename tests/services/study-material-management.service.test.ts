import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('StudyMaterialManagementService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('creates study materials without relying on unsupported schema fields', async () => {
    const resourceRepository = {
      create: vi.fn().mockResolvedValue({ id: 'r2', status: 'DRAFT' }),
      update: vi.fn(),
      findByModule: vi.fn(),
      reorder: vi.fn().mockResolvedValue([{ id: 'r1' }]),
    }

    vi.doMock('@/server/repositories/resource.repository', () => ({ resourceRepository }))

    const { StudyMaterialManagementService } = await import('../../server/services/study-material-management.service')
    const service = new StudyMaterialManagementService()

    await service.createResource({ moduleId: 'm1', title: 'Notes', description: 'Intro', displayOrder: 3, type: 'NOTES', url: 'https://example.com/notes' })

    expect(resourceRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      moduleId: 'm1',
      title: 'Notes',
      materialType: 'NOTES',
      url: 'https://example.com/notes',
      status: 'DRAFT',
    }))
    expect(resourceRepository.create).not.toHaveBeenCalledWith(expect.objectContaining({ description: 'Intro' }))
    expect(resourceRepository.create).not.toHaveBeenCalledWith(expect.objectContaining({ displayOrder: 3 }))
  })

  it('creates, updates, publishes, archives, and reorders study materials', async () => {
    const resourceRepository = {
      findByModule: vi.fn().mockResolvedValue([
        { id: 'r1', moduleId: 'm1', lessonId: null, title: 'Notes', description: 'Intro', materialType: 'NOTES', url: 'https://example.com/notes', isPremium: false, status: 'DRAFT', publishedAt: null, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-02-01') },
      ]),
      create: vi.fn().mockResolvedValue({ id: 'r2', status: 'DRAFT' }),
      update: vi.fn().mockResolvedValueOnce({ id: 'r1', status: 'PUBLISHED' }).mockResolvedValueOnce({ id: 'r1', status: 'ARCHIVED' }).mockResolvedValueOnce({ id: 'r1', status: 'DRAFT' }),
      reorder: vi.fn().mockResolvedValue([{ id: 'r1' }]),
    }

    vi.doMock('@/server/repositories/resource.repository', () => ({ resourceRepository }))

    const { StudyMaterialManagementService } = await import('../../server/services/study-material-management.service')
    const service = new StudyMaterialManagementService()

    const created = await service.createResource({ moduleId: 'm1', title: 'Notes', type: 'NOTES', url: 'https://example.com/notes' })
    const published = await service.publishResource('r1')
    const archived = await service.archiveResource('r1')
    const unpublished = await service.unpublishResource('r1')
    const reordered = await service.reorderResources('m1', ['r1'])

    expect(created.status).toBe('DRAFT')
    expect(published.status).toBe('PUBLISHED')
    expect(archived.status).toBe('ARCHIVED')
    expect(unpublished.status).toBe('DRAFT')
    expect(reordered).toHaveLength(1)
  })
})
