import { describe, expect, it, vi } from 'vitest'

describe('module management search and filtering', () => {
  it('applies search and status filters via the repository query layer', async () => {
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
    const dto = await service.listModules({ search: 'air', examType: 'DGCA', status: 'PUBLISHED', sortBy: 'updated' })

    expect(moduleRepository.findModulesForAdmin).toHaveBeenCalledWith(expect.objectContaining({ search: 'air', examType: 'DGCA', status: 'PUBLISHED' }))
    expect(dto.items).toHaveLength(1)
  })
})
