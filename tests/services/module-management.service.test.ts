import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('ModuleManagementService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('lists modules with search, exam-type, status, and pagination filters', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn().mockResolvedValue([
        { id: 'm1', title: 'Airframes', slug: 'airframes', moduleNumber: '01', description: 'Intro', difficulty: 'BEGINNER', estimatedHours: 4, displayOrder: 1, status: 'PUBLISHED', publishedAt: new Date('2024-01-01'), createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-02-01'), course: { title: 'DGCA Part-66' }, lessons: [], studyMaterials: [] },
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
    const dto = await service.listModules({ search: 'air', examType: 'DGCA', status: 'PUBLISHED', sortBy: 'updated', page: 1, pageSize: 10 })

    expect(moduleRepository.findModulesForAdmin).toHaveBeenCalledWith(expect.objectContaining({ search: 'air', examType: 'DGCA', status: 'PUBLISHED', sortBy: 'updated', skip: 0, take: 10 }))
    expect(dto.items[0]).toMatchObject({ id: 'm1', title: 'Airframes', examType: 'DGCA', status: 'PUBLISHED' })
    expect(dto.pagination.totalItems).toBe(1)
  })

  it('returns a module detail DTO with metadata and resource counts', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn(),
      countModulesForAdmin: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      setPublishState: vi.fn(),
      getModuleDetail: vi.fn().mockResolvedValue({
        id: 'm2',
        title: 'Navigation',
        slug: 'navigation',
        moduleNumber: '02',
        description: 'Guidance',
        difficulty: 'INTERMEDIATE',
        estimatedHours: 6,
        displayOrder: 2,
        status: 'DRAFT',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-02'),
        publishedAt: null,
        course: { title: 'EASA ATPL' },
        lessons: [{ id: 'l1', title: 'Lesson', displayOrder: 1, status: 'PUBLISHED' }],
        studyMaterials: [{ id: 'r1', title: 'Notes', materialType: 'PDF', status: 'DRAFT', displayOrder: 1 }],
      }),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { ModuleManagementService } = await import('../../server/services/module-management.service')
    const service = new ModuleManagementService()
    const detail = await service.getModuleDetail('m2')

    expect(detail.examType).toBe('EASA')
    expect(detail.resources).toHaveLength(1)
    expect(detail.status).toBe('DRAFT')
  })

  it('archives and unarchives modules without deleting them', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn(),
      countModulesForAdmin: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 'm3', status: 'ARCHIVED' }),
      setPublishState: vi.fn().mockResolvedValue({ id: 'm3', status: 'DRAFT' }),
      getModuleDetail: vi.fn(),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { ModuleManagementService } = await import('../../server/services/module-management.service')
    const service = new ModuleManagementService()
    const archived = await service.archiveModule('m3')
    const restored = await service.unarchiveModule('m3')

    expect(moduleRepository.update).toHaveBeenCalledWith('m3', expect.objectContaining({ status: 'ARCHIVED' }))
    expect(moduleRepository.setPublishState).toHaveBeenCalledWith('m3', 'DRAFT')
    expect(archived.status).toBe('ARCHIVED')
    expect(restored.status).toBe('DRAFT')
  })
})
