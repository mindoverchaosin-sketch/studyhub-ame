import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('content management services', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds a filtered module directory and summary for admin use', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn().mockResolvedValue([
        { id: 'm1', title: 'Airframes', slug: 'airframes', moduleNumber: '01', description: 'Intro', difficulty: 'BEGINNER', estimatedHours: 4, displayOrder: 1, status: 'PUBLISHED', publishedAt: new Date('2024-01-01'), createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-02-01'), course: { title: 'DGCA Part-66' } },
      ]),
      countModulesForAdmin: vi.fn().mockResolvedValue(1),
      create: vi.fn(),
      update: vi.fn(),
      setPublishState: vi.fn(),
      getModuleDetail: vi.fn(),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { ModuleManagementService } = await import('../../server/services/module-management.service')
    const service = new ModuleManagementService()
    const dto = await service.listModules({ search: 'air', examType: 'DGCA', status: 'PUBLISHED', sortBy: 'updated' })

    expect(moduleRepository.findModulesForAdmin).toHaveBeenCalledWith(expect.objectContaining({ search: 'air', examType: 'DGCA', status: 'PUBLISHED', sortBy: 'updated' }))
    expect(dto.items[0]).toMatchObject({ id: 'm1', title: 'Airframes', status: 'PUBLISHED', examType: 'DGCA' })
    expect(dto.summary.publishedCount).toBe(1)
  })

  it('archives and unarchives modules without deleting them', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn(),
      countModulesForAdmin: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 'm2', status: 'ARCHIVED' }),
      setPublishState: vi.fn().mockResolvedValue({ id: 'm2', status: 'DRAFT' }),
      getModuleDetail: vi.fn(),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { ModuleManagementService } = await import('../../server/services/module-management.service')
    const service = new ModuleManagementService()
    const archived = await service.archiveModule('m2')
    const restored = await service.unarchiveModule('m2')

    expect(moduleRepository.update).toHaveBeenCalledWith('m2', expect.objectContaining({ status: 'ARCHIVED' }))
    expect(moduleRepository.setPublishState).toHaveBeenCalledWith('m2', 'DRAFT')
    expect(archived.status).toBe('ARCHIVED')
    expect(restored.status).toBe('DRAFT')
  })

  it('publishes and unpublishes resources and reorders them', async () => {
    const resourceRepository = {
      findByModule: vi.fn().mockResolvedValue([
        { id: 'r1', title: 'Intro', materialType: 'NOTES', status: 'DRAFT', displayOrder: 1 },
        { id: 'r2', title: 'Quiz', materialType: 'PDF', status: 'PUBLISHED', displayOrder: 2 },
      ]),
      create: vi.fn(),
      update: vi.fn().mockResolvedValueOnce({ id: 'r1', status: 'PUBLISHED' }).mockResolvedValueOnce({ id: 'r1', status: 'DRAFT' }),
      reorder: vi.fn().mockResolvedValue([{ id: 'r2' }, { id: 'r1' }]),
    }

    vi.doMock('@/server/repositories/resource.repository', () => ({ resourceRepository }))

    const { StudyMaterialManagementService } = await import('../../server/services/study-material-management.service')
    const service = new StudyMaterialManagementService()

    const published = await service.publishResource('r1')
    const unpublished = await service.unpublishResource('r1')
    const reordered = await service.reorderResources('m1', ['r2', 'r1'])

    expect(published.status).toBe('PUBLISHED')
    expect(unpublished.status).toBe('DRAFT')
    expect(reordered).toHaveLength(2)
  })

  it('requires permission for create module actions', async () => {
    const requirePermission = vi.fn().mockRejectedValue(new Error('no'))
    const moduleRepository = { create: vi.fn() }

    vi.doMock('@/auth', () => ({ requirePermission }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { createModuleAction } = await import('../../server/actions/content-management.actions')

    await expect(createModuleAction({ title: 'New Module' } as any)).rejects.toThrow('no')
    expect(requirePermission).toHaveBeenCalled()
  })
})
