import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  studyMaterialFindFirst: vi.fn(),
  subscriptionFindFirst: vi.fn(),
  sanitizeDocument: vi.fn(),
  renderPdf: vi.fn(),
}))

vi.mock('@/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/auth')>()
  return { ...actual, requireStudent: mocks.requireStudent }
})
vi.mock('@/lib/prisma', () => ({
  default: {
    studyMaterial: { findFirst: mocks.studyMaterialFindFirst },
    subscription: { findFirst: mocks.subscriptionFindFirst },
  },
}))
vi.mock('@/lib/study-material/document-schema', () => ({
  sanitizeStudyMaterialDocument: mocks.sanitizeDocument,
}))
vi.mock('@/lib/study-material/pdf-renderer', () => ({
  renderStudyMaterialPdf: mocks.renderPdf,
}))

function persistedMaterial(parent: 'FREE' | 'MODULE_PREMIUM' | 'COURSE_PREMIUM') {
  const modulePremium = parent === 'MODULE_PREMIUM'
  const coursePremium = parent === 'COURSE_PREMIUM'

  return {
    id: 'material-1',
    title: 'Persisted Study Material',
    isPremium: false,
    moduleId: 'module-1',
    lessonId: null,
    status: 'PUBLISHED',
    deletedAt: null,
    documentContent: { metadata: {} },
    module: {
      id: 'module-1',
      moduleNumber: '1',
      courseId: 'course-1',
      isPremium: modulePremium,
      status: 'PUBLISHED',
      deletedAt: null,
      course: {
        id: 'course-1',
        isPremium: coursePremium,
        status: 'PUBLISHED',
        deletedAt: null,
      },
    },
    lesson: null,
  }
}

async function requestPdf() {
  const { GET } = await import('@/app/api/study-materials/[id]/pdf/route')
  return GET(
    new Request('https://app.test/api/study-materials/material-1/pdf'),
    { params: Promise.resolve({ id: 'material-1' }) },
  )
}

describe('PDF route persisted access integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({
      user: { id: 'student-1', role: 'STUDENT' },
    })
    mocks.studyMaterialFindFirst.mockImplementation(async ({ where }) => (
      where.id === 'material-1' ? persistedMaterial('FREE') : null
    ))
    mocks.subscriptionFindFirst.mockResolvedValue(null)
    mocks.sanitizeDocument.mockImplementation((document) => document)
    mocks.renderPdf.mockResolvedValue(Buffer.from('%PDF-1.7'))
  })

  it.each([
    ['module', 'MODULE_PREMIUM'],
    ['course', 'COURSE_PREMIUM'],
  ] as const)('denies material inheriting premium access from its persisted %s', async (_parent, parentState) => {
    mocks.studyMaterialFindFirst.mockImplementation(async ({ where }) => (
      where.id === 'material-1' ? persistedMaterial(parentState) : null
    ))

    const response = await requestPdf()

    expect(response.status).toBe(403)
    expect(mocks.studyMaterialFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'material-1', status: 'PUBLISHED', deletedAt: null },
      include: expect.objectContaining({
        module: expect.objectContaining({
          select: expect.objectContaining({
            isPremium: true,
            status: true,
            deletedAt: true,
            course: expect.objectContaining({
              select: expect.objectContaining({
                isPremium: true,
                status: true,
                deletedAt: true,
              }),
            }),
          }),
        }),
      }),
    }))
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'student-1' },
    }))
    expect(mocks.renderPdf).not.toHaveBeenCalled()
  })

  it('allows persisted premium-parent content with an active premium subscription', async () => {
    mocks.studyMaterialFindFirst.mockImplementation(async ({ where }) => (
      where.id === 'material-1' ? persistedMaterial('MODULE_PREMIUM') : null
    ))
    mocks.subscriptionFindFirst.mockResolvedValue({
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
      subscriptionPlan: { slug: 'monthly' },
    })

    const response = await requestPdf()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(mocks.subscriptionFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'student-1' },
    }))
    expect(mocks.renderPdf).toHaveBeenCalledOnce()
  })

  it('preserves access to persisted free material without a subscription', async () => {
    const response = await requestPdf()

    expect(response.status).toBe(200)
    expect(mocks.studyMaterialFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'material-1', status: 'PUBLISHED', deletedAt: null },
    }))
    expect(mocks.subscriptionFindFirst).not.toHaveBeenCalled()
    expect(mocks.renderPdf).toHaveBeenCalledOnce()
  })
})
