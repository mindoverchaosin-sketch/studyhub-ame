import { beforeEach, describe, expect, it, vi } from 'vitest'

const validLesson = { id: 'l1', moduleId: 'm1', deletedAt: null }

function setupRepositoryMocks(overrides: { lesson?: Record<string, unknown> | null; resourceRow?: Record<string, unknown> | null } = {}) {
  const resourceRepository = {
    findByModule: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(overrides.resourceRow === undefined ? { id: 'r1', moduleId: 'm1', title: 'Notes', materialType: 'NOTES', url: '/media/notes.txt', isPremium: false, status: 'DRAFT', publishedAt: null, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-02-01') } : overrides.resourceRow),
    create: vi.fn().mockResolvedValue({ id: 'r2', status: 'DRAFT' }),
    update: vi.fn().mockResolvedValue({ id: 'r1', status: 'DRAFT' }),
    reorder: vi.fn().mockResolvedValue([{ id: 'r1' }]),
  }
  const lessonRepository = {
    findById: vi.fn().mockImplementation(async (id: string) => {
      if (overrides.lesson === undefined && id === validLesson.id) return validLesson
      return overrides.lesson ?? null
    }),
  }

  vi.doMock('@/server/repositories/resource.repository', () => ({ resourceRepository }))
  vi.doMock('@/server/repositories/lesson.repository', () => ({ lessonRepository }))

  return { resourceRepository, lessonRepository }
}

async function importService() {
  const { StudyMaterialManagementService } = await import('../../server/services/study-material-management.service')
  return new StudyMaterialManagementService()
}

describe('StudyMaterialManagementService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('creates study materials bound to a validated lesson and persists displayOrder when provided', async () => {
    const { resourceRepository } = setupRepositoryMocks()
    const service = await importService()

    await service.createResource({ moduleId: 'm1', lessonId: 'l1', title: 'Notes', description: 'Intro', displayOrder: 3, type: 'NOTES', url: '/media/notes.txt' })

    expect(resourceRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      moduleId: 'm1',
      lessonId: 'l1',
      title: 'Notes',
      materialType: 'NOTES',
      url: '/media/notes.txt',
      status: 'DRAFT',
      displayOrder: 3,
    }))
    expect(resourceRepository.create).not.toHaveBeenCalledWith(expect.objectContaining({ description: 'Intro' }))
  })

  it('creates study materials with max+1 displayOrder when omitted', async () => {
    const { resourceRepository } = setupRepositoryMocks()
    resourceRepository.findByModule.mockResolvedValue([
      { id: 'r0', displayOrder: 2 },
      { id: 'r1', displayOrder: 5 },
    ])
    const service = await importService()

    await service.createResource({ moduleId: 'm1', lessonId: 'l1', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' })

    const payload = resourceRepository.create.mock.calls[0][0]
    expect(payload.displayOrder).toBe(6)
  })

  it('creates first resource with displayOrder=1 when module is empty', async () => {
    const { resourceRepository } = setupRepositoryMocks()
    resourceRepository.findByModule.mockResolvedValue([])
    const service = await importService()

    await service.createResource({ moduleId: 'm1', lessonId: 'l1', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' })

    const payload = resourceRepository.create.mock.calls[0][0]
    expect(payload.displayOrder).toBe(1)
  })

  it('persists moduleId derived from the validated lesson', async () => {
    const { resourceRepository } = setupRepositoryMocks()
    const service = await importService()

    await service.createResource({ moduleId: 'm1', lessonId: 'l1', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' })

    const payload = resourceRepository.create.mock.calls[0][0]
    expect(payload.lessonId).toBe(validLesson.id)
    expect(payload.moduleId).toBe(validLesson.moduleId)
  })

  it('rejects a lesson belonging to a different module without creating the material', async () => {
    const { resourceRepository } = setupRepositoryMocks({ lesson: { id: 'l9', moduleId: 'm9', deletedAt: null } })
    const service = await importService()

    await expect(service.createResource({ moduleId: 'm1', lessonId: 'l9', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' })).rejects.toThrow('does not belong to the requested module')
    expect(resourceRepository.create).not.toHaveBeenCalled()
  })

  it('rejects a nonexistent lesson without creating the material', async () => {
    const { resourceRepository } = setupRepositoryMocks({ lesson: null })
    const service = await importService()

    await expect(service.createResource({ moduleId: 'm1', lessonId: 'missing', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' })).rejects.toThrow('Lesson for binding not found')
    expect(resourceRepository.create).not.toHaveBeenCalled()
  })

  it('rejects a soft-deleted lesson without creating the material', async () => {
    const { resourceRepository } = setupRepositoryMocks({ lesson: { id: 'ldel', moduleId: 'm1', deletedAt: new Date('2024-06-01') } })
    const service = await importService()

    await expect(service.createResource({ moduleId: 'm1', lessonId: 'ldel', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' })).rejects.toThrow('Lesson for binding not found')
    expect(resourceRepository.create).not.toHaveBeenCalled()
  })

  it('requires lessonId for newly authored materials', async () => {
    const { resourceRepository } = setupRepositoryMocks()
    const service = await importService()

    await expect(service.createResource({ moduleId: 'm1', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' } as never)).rejects.toThrow('lessonId is required')
    expect(resourceRepository.create).not.toHaveBeenCalled()
  })

  describe('displayOrder persistence', () => {
    it('persists explicit displayOrder on update when provided', async () => {
      const { resourceRepository } = setupRepositoryMocks({ resourceRow: undefined })
      const service = await importService()

      await service.updateResource('r1', { displayOrder: 7 })

      expect(resourceRepository.update).toHaveBeenCalledWith('r1', { displayOrder: 7 })
    })

    it('preserves existing displayOrder when omitted on update without lesson change', async () => {
      const { resourceRepository } = setupRepositoryMocks({ resourceRow: undefined })
      const service = await importService()

      await service.updateResource('r1', { title: 'Renamed' })

      const payload = resourceRepository.update.mock.calls[0][1]
      expect(payload).toEqual({ title: 'Renamed' })
      expect(payload).not.toHaveProperty('displayOrder')
    })

    it('assigns max+1 when moving resource to a different lesson in same module', async () => {
      const { resourceRepository } = setupRepositoryMocks({
        lesson: { id: 'l2', moduleId: 'm1', deletedAt: null },
        resourceRow: { id: 'r1', moduleId: 'm1', lessonId: 'l1', displayOrder: 2 },
      })
      resourceRepository.findByModule.mockResolvedValue([
        { id: 'r0', displayOrder: 1 },
        { id: 'r1', displayOrder: 2 },
        { id: 'r2', displayOrder: 3 },
      ])
      const service = await importService()

      await service.updateResource('r1', { lessonId: 'l2' })

      expect(resourceRepository.update).toHaveBeenCalledWith('r1', { lessonId: 'l2', moduleId: 'm1', displayOrder: 4 })
    })

    it('preserves displayOrder when moving within same lesson', async () => {
      const { resourceRepository } = setupRepositoryMocks({
        lesson: { id: 'l1', moduleId: 'm1', deletedAt: null },
        resourceRow: { id: 'r1', moduleId: 'm1', lessonId: 'l1', displayOrder: 2 },
      })
      const service = await importService()

      await service.updateResource('r1', { lessonId: 'l1', title: 'Renamed' })

      const payload = resourceRepository.update.mock.calls[0][1]
      expect(payload).toEqual({ title: 'Renamed', lessonId: 'l1', moduleId: 'm1' })
      expect(payload).not.toHaveProperty('displayOrder')
    })

    it('persists explicit displayOrder even when moving to a different lesson', async () => {
      const { resourceRepository } = setupRepositoryMocks({
        lesson: { id: 'l2', moduleId: 'm1', deletedAt: null },
        resourceRow: { id: 'r1', moduleId: 'm1', lessonId: 'l1', displayOrder: 2 },
      })
      const service = await importService()

      await service.updateResource('r1', { lessonId: 'l2', displayOrder: 10 })

      expect(resourceRepository.update).toHaveBeenCalledWith('r1', { lessonId: 'l2', moduleId: 'm1', displayOrder: 10 })
    })
  })

  describe('moving a material between lessons', () => {
    it('updates lessonId and moduleId together in one repository update without displayOrder when moving', async () => {
      const { resourceRepository } = setupRepositoryMocks({
        lesson: { id: 'l2', moduleId: 'm1', deletedAt: null },
        resourceRow: { id: 'r1', moduleId: 'm1', lessonId: 'l1', displayOrder: 2 },
      })
      resourceRepository.findByModule.mockResolvedValue([
        { id: 'r0', displayOrder: 1 },
        { id: 'r1', displayOrder: 2 },
      ])
      const service = await importService()

      await service.updateResource('r1', { lessonId: 'l2' })

      expect(resourceRepository.update).toHaveBeenCalledTimes(1)
      expect(resourceRepository.update).toHaveBeenCalledWith('r1', { lessonId: 'l2', moduleId: 'm1', displayOrder: 3 })
    })

    it('keeps other fields intact while rebinding alongside them and assigns max+1', async () => {
      const { resourceRepository } = setupRepositoryMocks({
        lesson: { id: 'l2', moduleId: 'm1', deletedAt: null },
        resourceRow: { id: 'r1', moduleId: 'm1', lessonId: 'l1', displayOrder: 2 },
      })
      resourceRepository.findByModule.mockResolvedValue([
        { id: 'r0', displayOrder: 1 },
        { id: 'r1', displayOrder: 2 },
      ])
      const service = await importService()

      await service.updateResource('r1', { lessonId: 'l2', title: 'Renamed', isPremium: true })

      expect(resourceRepository.update).toHaveBeenCalledWith('r1', { title: 'Renamed', isPremium: true, lessonId: 'l2', moduleId: 'm1', displayOrder: 3 })
    })

    it('rejects moving to a lesson in another module without updating', async () => {
      const { resourceRepository } = setupRepositoryMocks({
        lesson: { id: 'l9', moduleId: 'm9', deletedAt: null },
        resourceRow: undefined,
      })
      const service = await importService()

      await expect(service.updateResource('r1', { lessonId: 'l9' })).rejects.toThrow('different module')
      expect(resourceRepository.update).not.toHaveBeenCalled()
    })

    it('rejects moving to a nonexistent lesson without updating', async () => {
      const { resourceRepository } = setupRepositoryMocks({ lesson: null, resourceRow: undefined })
      const service = await importService()

      await expect(service.updateResource('r1', { lessonId: 'ghost' })).rejects.toThrow('Lesson for binding not found')
      expect(resourceRepository.update).not.toHaveBeenCalled()
    })

    it('rejects moving to a soft-deleted lesson without updating', async () => {
      const { resourceRepository } = setupRepositoryMocks({ lesson: { id: 'ldel', moduleId: 'm1', deletedAt: new Date() }, resourceRow: undefined })
      const service = await importService()

      await expect(service.updateResource('r1', { lessonId: 'ldel' })).rejects.toThrow('Lesson for binding not found')
      expect(resourceRepository.update).not.toHaveBeenCalled()
    })

    it('rejects the move when the material itself does not exist', async () => {
      const { resourceRepository } = setupRepositoryMocks({ lesson: { id: 'l2', moduleId: 'm1', deletedAt: null }, resourceRow: null })
      const service = await importService()

      await expect(service.updateResource('ghost-material', { lessonId: 'l2' })).rejects.toThrow('Study material not found')
      expect(resourceRepository.update).not.toHaveBeenCalled()
    })

    it('preserves the existing binding when lessonId is omitted', async () => {
      const { resourceRepository, lessonRepository } = setupRepositoryMocks({ resourceRow: undefined })
      const service = await importService()

      await service.updateResource('r1', { title: 'Renamed', status: 'PUBLISHED' })

      const payload = resourceRepository.update.mock.calls[0][1]
      expect(payload).toEqual({ title: 'Renamed', status: 'PUBLISHED' })
      expect(payload).not.toHaveProperty('lessonId')
      expect(payload).not.toHaveProperty('moduleId')
      expect(lessonRepository.findById).not.toHaveBeenCalled()
    })
  })

  it('delegates reorderResources to repository.reorder unchanged', async () => {
    const { resourceRepository } = setupRepositoryMocks()
    const service = await importService()

    const result = await service.reorderResources('m1', ['r1', 'r2', 'r3'])

    expect(resourceRepository.reorder).toHaveBeenCalledWith('m1', ['r1', 'r2', 'r3'])
    expect(result).toEqual([{ id: 'r1' }])
  })

  it('creates with displayOrder=1 when module is empty in integration flow', async () => {
    const { resourceRepository, lessonRepository } = setupRepositoryMocks()
    resourceRepository.update
      .mockResolvedValueOnce({ id: 'r1', status: 'PUBLISHED' })
      .mockResolvedValueOnce({ id: 'r1', status: 'ARCHIVED' })
      .mockResolvedValueOnce({ id: 'r1', status: 'DRAFT' })
    const service = await importService()

    const created = await service.createResource({ moduleId: 'm1', lessonId: 'l1', title: 'Notes', type: 'NOTES', url: '/media/notes.txt' })
    const published = await service.publishResource('r1')
    const archived = await service.archiveResource('r1')
    const unpublished = await service.unpublishResource('r1')
    const reordered = await service.reorderResources('m1', ['r1'])

    expect(created.status).toBe('DRAFT')
    expect(resourceRepository.create).toHaveBeenCalledWith(expect.objectContaining({ displayOrder: 1 }))
    expect(published.status).toBe('PUBLISHED')
    expect(archived.status).toBe('ARCHIVED')
    expect(unpublished.status).toBe('DRAFT')
    expect(reordered).toHaveLength(1)
    expect(lessonRepository.findById).toHaveBeenCalledWith('l1')
  })

  it('rejects archiveResource when the study material does not exist', async () => {
    const { resourceRepository } = setupRepositoryMocks({ resourceRow: null })
    const service = await importService()

    await expect(service.archiveResource('ghost')).rejects.toThrow('Study material not found')
    expect(resourceRepository.update).not.toHaveBeenCalled()
  })

  it('rejects publishResource when the study material does not exist', async () => {
    const { resourceRepository } = setupRepositoryMocks({ resourceRow: null })
    const service = await importService()

    await expect(service.publishResource('ghost')).rejects.toThrow('Study material not found')
    expect(resourceRepository.update).not.toHaveBeenCalled()
  })

  it('rejects unpublishResource when the study material does not exist', async () => {
    const { resourceRepository } = setupRepositoryMocks({ resourceRow: null })
    const service = await importService()

    await expect(service.unpublishResource('ghost')).rejects.toThrow('Study material not found')
    expect(resourceRepository.update).not.toHaveBeenCalled()
  })

  it('rejects unarchiveResource when the study material does not exist', async () => {
    const { resourceRepository } = setupRepositoryMocks({ resourceRow: null })
    const service = await importService()

    await expect(service.unarchiveResource('ghost')).rejects.toThrow('Study material not found')
    expect(resourceRepository.update).not.toHaveBeenCalled()
  })

  it.each([
    'https://example.com/notes',
    'http://localhost/notes',
    'http://127.0.0.1/notes',
    'http://10.0.0.1/notes',
    'http://169.254.169.254/latest/meta-data',
    'file:///etc/passwd',
    'ftp://example.com/notes',
  ])('rejects unsafe resource URL %s', async (url) => {
    const { resourceRepository } = setupRepositoryMocks()
    const service = await importService()

    await expect(service.createResource({ moduleId: 'm1', lessonId: 'l1', title: 'Notes', type: 'NOTES', url })).rejects.toThrow('relative /media/ path')
    expect(resourceRepository.create).not.toHaveBeenCalled()
  })

  it('accepts controlled relative media URLs on update', async () => {
    const { resourceRepository } = setupRepositoryMocks({ resourceRow: undefined })
    const service = await importService()

    await service.updateResource('r1', { url: '/media/updated.pdf' })
    expect(resourceRepository.update).toHaveBeenCalledWith('r1', { url: '/media/updated.pdf' })
  })
})
