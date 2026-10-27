import { beforeEach, describe, expect, it, vi } from 'vitest'

function paper(overrides: Record<string, unknown> = {}) {
  return {
    id: 'paper-1', courseId: 'course-1', moduleId: 'module-1', year: 2025, title: 'Air Navigation', paperType: 'Official PDF', mediaPath: '/media/air-navigation.pdf', isPremium: false, status: 'DRAFT', publishedAt: null, createdAt: new Date(), updatedAt: new Date(), course: { id: 'course-1', title: 'DGCA', isPremium: false, status: 'PUBLISHED', deletedAt: null }, module: { id: 'module-1', courseId: 'course-1', title: 'Air Navigation', isPremium: false, status: 'PUBLISHED', deletedAt: null }, ...overrides,
  }
}

describe('PreviousOfficialPaperService', () => {
  beforeEach(() => { vi.resetModules() })

  it('creates papers and validates the course/module relationship', async () => {
    const repository = { findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn(), findPublishedById: vi.fn(), create: vi.fn().mockResolvedValue(paper()), update: vi.fn() }
    const courseRepository = { findById: vi.fn().mockResolvedValue({ id: 'course-1' }) }
    const moduleRepository = { findById: vi.fn().mockResolvedValue({ id: 'module-1', courseId: 'course-1' }) }
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: vi.fn() } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    const result = await previousOfficialPaperService.create({ courseId: 'course-1', moduleId: 'module-1', year: 2025, title: 'Air Navigation', paperType: 'Official PDF', mediaPath: '/media/air-navigation.pdf' })

    expect(result.courseTitle).toBe('DGCA')
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ year: 2025, mediaPath: '/media/air-navigation.pdf' }))
  })

  it('rejects mismatched course and module relationships', async () => {
    const repository = { findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn(), findPublishedById: vi.fn(), create: vi.fn(), update: vi.fn() }
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn().mockResolvedValue({ id: 'course-1' }) } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn().mockResolvedValue({ id: 'module-1', courseId: 'other-course' }) } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: vi.fn() } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    await expect(previousOfficialPaperService.create({ courseId: 'course-1', moduleId: 'module-1', year: 2025, title: 'Paper', paperType: 'Official PDF', mediaPath: '/media/paper.pdf' })).rejects.toThrow('relationship')
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('supports filters and lifecycle transitions', async () => {
    const repository = { findForAdmin: vi.fn().mockResolvedValue([paper()]), findPublished: vi.fn().mockResolvedValue([]), findById: vi.fn().mockResolvedValue(paper()), findPublishedById: vi.fn(), create: vi.fn(), update: vi.fn().mockResolvedValue(paper({ status: 'PUBLISHED' })) }
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: vi.fn() } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    await previousOfficialPaperService.listForAdmin({ year: 2025, status: 'DRAFT' })
    await previousOfficialPaperService.publish('paper-1')
    await previousOfficialPaperService.archive('paper-1')
    await previousOfficialPaperService.unpublish('paper-1')

    expect(repository.findForAdmin).toHaveBeenCalledWith({ year: 2025, status: 'DRAFT' })
    expect(repository.update).toHaveBeenCalledTimes(3)
  })

  it('throws domain not-found for archive when the paper does not exist', async () => {
    const repository = { findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn().mockResolvedValue(null), findPublishedById: vi.fn(), create: vi.fn(), update: vi.fn() }
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: vi.fn() } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    await expect(previousOfficialPaperService.archive('ghost')).rejects.toThrow('Paper not found')
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('throws domain not-found for publish when the paper does not exist', async () => {
    const repository = { findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn().mockResolvedValue(null), findPublishedById: vi.fn(), create: vi.fn(), update: vi.fn() }
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: vi.fn() } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    await expect(previousOfficialPaperService.publish('ghost')).rejects.toThrow('Paper not found')
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('throws domain not-found for unpublish when the paper does not exist', async () => {
    const repository = { findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn().mockResolvedValue(null), findPublishedById: vi.fn(), create: vi.fn(), update: vi.fn() }
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: vi.fn() } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    await expect(previousOfficialPaperService.unpublish('ghost')).rejects.toThrow('Paper not found')
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('returns premium access decisions without exposing media to student DTOs', async () => {
    const repository = { findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn(), findPublishedById: vi.fn().mockResolvedValue(paper({ isPremium: true })), create: vi.fn(), update: vi.fn() }
    const access = vi.fn().mockResolvedValue({ allowed: false, requiredFeature: 'premiumModules', reason: 'Premium module access required' })
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: access } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    const result = await previousOfficialPaperService.getStudentAccess('student-1', 'paper-1')

    expect(result?.allowed).toBe(false)
    expect(result?.paper.mediaPath).toBe('/media/air-navigation.pdf')
    expect(access).toHaveBeenCalledWith('student-1', true)
  })

  it('allows free papers through the server-side access policy', async () => {
    const repository = {
      findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn(),
      findPublishedById: vi.fn().mockResolvedValue(paper()),
      create: vi.fn(), update: vi.fn(),
    }
    const access = vi.fn().mockResolvedValue({ allowed: true })
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: access } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    const result = await previousOfficialPaperService.getStudentAccess('student-1', 'paper-1')

    expect(result?.allowed).toBe(true)
    expect(access).toHaveBeenCalledWith('student-1', false)
  })

  it('allows premium papers only when the server-side access policy grants them', async () => {
    const repository = {
      findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn(),
      findPublishedById: vi.fn().mockResolvedValue(paper({ isPremium: true })),
      create: vi.fn(), update: vi.fn(),
    }
    const access = vi.fn().mockResolvedValue({ allowed: true })
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: access } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    const result = await previousOfficialPaperService.getStudentAccess('student-1', 'paper-1')

    expect(result?.allowed).toBe(true)
    expect(access).toHaveBeenCalledWith('student-1', true)
  })

  it('inherits premium access from its persisted parent course or module', async () => {
    const repository = {
      findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn(),
      findPublishedById: vi.fn().mockResolvedValue(paper({
        module: { id: 'module-1', courseId: 'course-1', title: 'Air Navigation', isPremium: true, status: 'PUBLISHED', deletedAt: null },
      })),
      create: vi.fn(), update: vi.fn(),
    }
    const access = vi.fn().mockResolvedValue({ allowed: false, requiredFeature: 'premiumModules' })
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: access } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    const result = await previousOfficialPaperService.getStudentAccess('student-1', 'paper-1')

    expect(result?.allowed).toBe(false)
    expect(access).toHaveBeenCalledWith('student-1', true)
  })

  it.each([
    ['unpublished module', { module: { id: 'module-1', courseId: 'course-1', title: 'Air Navigation', isPremium: false, status: 'DRAFT', deletedAt: null } }],
    ['deleted course', { course: { id: 'course-1', title: 'DGCA', isPremium: false, status: 'PUBLISHED', deletedAt: new Date() } }],
    ['mismatched module course', { module: { id: 'module-1', courseId: 'other-course', title: 'Air Navigation', isPremium: false, status: 'PUBLISHED', deletedAt: null } }],
  ])('rejects a paper with %s', async (_label, overrides) => {
    const repository = {
      findForAdmin: vi.fn(), findPublished: vi.fn(), findById: vi.fn(),
      findPublishedById: vi.fn().mockResolvedValue(paper(overrides)),
      create: vi.fn(), update: vi.fn(),
    }
    const access = vi.fn()
    vi.doMock('@/server/repositories/previous-official-paper.repository', () => ({ previousOfficialPaperRepository: repository }))
    vi.doMock('@/server/repositories/course.repository', () => ({ courseRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { findById: vi.fn() } }))
    vi.doMock('@/server/services/content-access.service', () => ({ contentAccessService: { canAccessStudyMaterial: access } }))
    vi.doMock('@/server/services/study-material-management.service', () => ({ validateStudyMaterialUrl: (value: string) => value }))

    const { previousOfficialPaperService } = await import('@/server/services/previous-official-paper.service')
    await expect(previousOfficialPaperService.getStudentAccess('student-1', 'paper-1')).resolves.toBeNull()
    expect(access).not.toHaveBeenCalled()
  })
})
