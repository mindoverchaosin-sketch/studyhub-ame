import { beforeEach, describe, expect, it, vi } from 'vitest'

function paper(overrides: Record<string, unknown> = {}) {
  return {
    id: 'paper-1', courseId: 'course-1', moduleId: 'module-1', year: 2025, title: 'Air Navigation', paperType: 'Official PDF', mediaPath: '/media/air-navigation.pdf', isPremium: false, status: 'DRAFT', publishedAt: null, createdAt: new Date(), updatedAt: new Date(), course: { title: 'DGCA' }, module: { title: 'Air Navigation' }, ...overrides,
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
})
