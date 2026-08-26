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

  it('creates and updates modules with the premium flag', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn(),
      countModulesForAdmin: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'm4', status: 'DRAFT', isPremium: true }),
      update: vi.fn().mockResolvedValue({ id: 'm4', status: 'PUBLISHED', isPremium: false }),
      setPublishState: vi.fn(),
      getModuleDetail: vi.fn(),
      findById: vi.fn().mockResolvedValue({ id: 'm4' }),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { ModuleManagementService } = await import('../../server/services/module-management.service')
    const service = new ModuleManagementService()

    const created = await service.createModule({
      title: 'Premium Module',
      slug: 'premium-module',
      moduleNumber: '04',
      courseId: 'course-1',
      isPremium: true,
    } as any)

    const updated = await service.updateModule('m4', { isPremium: false })

    expect(moduleRepository.create).toHaveBeenCalledWith(expect.objectContaining({ isPremium: true }))
    expect(moduleRepository.update).toHaveBeenCalledWith('m4', expect.objectContaining({ isPremium: false }))
    expect(created.id).toBe('m4')
    expect(updated.id).toBe('m4')
  })

  it('supports premium create and update for mock tests through admin CMS', async () => {
    const mockTestRepository = {
      create: vi.fn().mockResolvedValue({ id: 'mt-1', title: 'Premium Mock', status: 'DRAFT', durationMinutes: 60, questionCount: 20, passingPercentage: 60, shuffleQuestions: false, isPremium: true, updatedAt: new Date() }),
      update: vi.fn().mockResolvedValue({ id: 'mt-1', title: 'Premium Mock', status: 'DRAFT', durationMinutes: 60, questionCount: 20, passingPercentage: 60, shuffleQuestions: false, isPremium: false, updatedAt: new Date() }),
      findById: vi.fn().mockResolvedValue({ id: 'mt-1', title: 'Premium Mock', status: 'DRAFT', durationMinutes: 60, questionCount: 20, passingPercentage: 60, shuffleQuestions: false, isPremium: true, updatedAt: new Date() }),
      delete: vi.fn(),
      list: vi.fn(),
      count: vi.fn(),
      duplicate: vi.fn(),
    }

    const auditRepository = { recordEvent: vi.fn() }

    vi.doMock('@/server/repositories/mock-test.repository', () => ({ mockTestRepository }))
    vi.doMock('@/server/repositories/audit.repository', () => ({ auditRepository }))

    const { createMockTest, updateMockTest } = await import('../../server/services/admin-cms.service')

    const created = await createMockTest({ title: 'Premium Mock', durationMinutes: 60, questionCount: 20, passingPercentage: 60, isPremium: true }, 'admin-1')
    const updated = await updateMockTest('mt-1', { isPremium: false }, 'admin-1')

    expect(created.success).toBe(true)
    expect(updated.success).toBe(true)
    expect(mockTestRepository.create).toHaveBeenCalledWith(expect.objectContaining({ isPremium: true }))
    expect(mockTestRepository.update).toHaveBeenCalledWith('mt-1', expect.objectContaining({ isPremium: false }))
  })

  it('archives and unarchives modules without deleting them', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn(),
      countModulesForAdmin: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: 'm3', status: 'ARCHIVED' }),
      setPublishState: vi.fn().mockResolvedValue({ id: 'm3', status: 'DRAFT' }),
      getModuleDetail: vi.fn(),
      findById: vi.fn().mockResolvedValue({ id: 'm3' }),
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

  it('throws domain not-found for archiveModule when the module does not exist', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn(),
      countModulesForAdmin: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      setPublishState: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      getModuleDetail: vi.fn(),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { ModuleManagementService } = await import('../../server/services/module-management.service')
    const service = new ModuleManagementService()

    await expect(service.archiveModule('ghost')).rejects.toThrow('Module not found')
    expect(moduleRepository.update).not.toHaveBeenCalled()
  })

  it('throws domain not-found for unarchiveModule when the module does not exist', async () => {
    const moduleRepository = {
      findModulesForAdmin: vi.fn(),
      countModulesForAdmin: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      setPublishState: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      getModuleDetail: vi.fn(),
    }

    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

    const { ModuleManagementService } = await import('../../server/services/module-management.service')
    const service = new ModuleManagementService()

    await expect(service.unarchiveModule('ghost')).rejects.toThrow('Module not found')
    expect(moduleRepository.setPublishState).not.toHaveBeenCalled()
  })
})
