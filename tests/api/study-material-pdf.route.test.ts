import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForbiddenError, UnauthorizedError } from '@/auth'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  requirePermission: vi.fn(),
  findById: vi.fn(),
  findPublishedById: vi.fn(),
  findModuleById: vi.fn(),
  canAccessStudyMaterial: vi.fn(),
  sanitizeDocument: vi.fn(),
  renderPdf: vi.fn(),
}))

vi.mock('@/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/auth')>()
  return {
    ...actual,
    requireStudent: mocks.requireStudent,
    requirePermission: mocks.requirePermission,
  }
})
vi.mock('@/server/repositories/resource.repository', () => ({
  resourceRepository: {
    findById: mocks.findById,
    findPublishedById: mocks.findPublishedById,
  },
}))
vi.mock('@/server/repositories/module.repository', () => ({
  moduleRepository: { findById: mocks.findModuleById },
}))
vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: { canAccessStudyMaterial: mocks.canAccessStudyMaterial },
}))
vi.mock('@/lib/study-material/document-schema', () => ({
  sanitizeStudyMaterialDocument: mocks.sanitizeDocument,
}))
vi.mock('@/lib/study-material/pdf-renderer', () => ({
  renderStudyMaterialPdf: mocks.renderPdf,
}))

const createResource = (overrides: Record<string, unknown> = {}) => ({
  id: 'material-1',
  title: 'Study Material',
  isPremium: false,
  moduleId: 'module-1',
  module: {
    id: 'module-1',
    moduleNumber: '1',
    isPremium: false,
    status: 'PUBLISHED',
    deletedAt: null,
    course: { isPremium: false, status: 'PUBLISHED', deletedAt: null },
  },
  documentContent: { metadata: {} },
  ...overrides,
})

async function requestPdf(url = 'https://app.test/api/study-materials/material-1/pdf') {
  const { GET } = await import('@/app/api/study-materials/[id]/pdf/route')
  return GET(new Request(url), { params: Promise.resolve({ id: 'material-1' }) })
}

describe('/api/study-materials/[id]/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    mocks.requirePermission.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mocks.findById.mockResolvedValue(createResource())
    mocks.findPublishedById.mockResolvedValue(createResource())
    mocks.canAccessStudyMaterial.mockResolvedValue({ allowed: true })
    mocks.sanitizeDocument.mockImplementation((document) => document)
    mocks.renderPdf.mockResolvedValue(Buffer.from('%PDF-1.7'))
  })

  it('rejects unauthenticated requests', async () => {
    mocks.requireStudent.mockRejectedValue(new UnauthorizedError())

    const response = await requestPdf()

    expect(response.status).toBe(401)
    expect(mocks.findPublishedById).not.toHaveBeenCalled()
  })

  it('rejects authenticated users without the student role', async () => {
    mocks.requireStudent.mockRejectedValue(new ForbiddenError('Student access required.'))

    const response = await requestPdf()

    expect(response.status).toBe(403)
    expect(mocks.findPublishedById).not.toHaveBeenCalled()
  })

  it('denies unpublished or missing materials', async () => {
    mocks.findPublishedById.mockResolvedValue(null)

    const response = await requestPdf()

    expect(response.status).toBe(404)
    expect(mocks.canAccessStudyMaterial).not.toHaveBeenCalled()
    expect(mocks.renderPdf).not.toHaveBeenCalled()
  })

  it('allows an authorized student to access eligible free material', async () => {
    const response = await requestPdf()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('cache-control')).toContain('private')
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(mocks.canAccessStudyMaterial).toHaveBeenCalledWith('student-1', false)
    expect(await response.text()).toContain('%PDF-1.7')
  })

  it('denies premium material when the student lacks entitlement', async () => {
    mocks.findPublishedById.mockResolvedValue(createResource({ isPremium: true }))
    mocks.canAccessStudyMaterial.mockResolvedValue({
      allowed: false,
      reason: 'Premium module access required',
    })

    const response = await requestPdf()

    expect(response.status).toBe(403)
    expect(mocks.canAccessStudyMaterial).toHaveBeenCalledWith('student-1', true)
    expect(mocks.renderPdf).not.toHaveBeenCalled()
  })

  it('allows premium material when the server-side entitlement check passes', async () => {
    mocks.findPublishedById.mockResolvedValue(createResource({ isPremium: true }))

    const response = await requestPdf()

    expect(response.status).toBe(200)
    expect(mocks.canAccessStudyMaterial).toHaveBeenCalledWith('student-1', true)
  })

  it.each([
    ['module', {
      module: {
        id: 'module-1',
        moduleNumber: '1',
        isPremium: true,
        status: 'PUBLISHED',
        deletedAt: null,
        course: { isPremium: false, status: 'PUBLISHED', deletedAt: null },
      },
    }],
    ['course', {
      module: {
        id: 'module-1',
        moduleNumber: '1',
        isPremium: false,
        status: 'PUBLISHED',
        deletedAt: null,
        course: { isPremium: true, status: 'PUBLISHED', deletedAt: null },
      },
    }],
  ])('denies free material inherited from a premium %s without entitlement', async (_parent, overrides) => {
    mocks.findPublishedById.mockResolvedValue(createResource(overrides))
    mocks.canAccessStudyMaterial.mockResolvedValue({
      allowed: false,
      reason: 'Premium module access required',
    })

    const response = await requestPdf()

    expect(response.status).toBe(403)
    expect(mocks.canAccessStudyMaterial).toHaveBeenCalledWith('student-1', true)
    expect(mocks.renderPdf).not.toHaveBeenCalled()
  })

  it('rejects unpublished parent content before checking access or rendering', async () => {
    mocks.findPublishedById.mockResolvedValue(createResource({
      module: {
        id: 'module-1',
        moduleNumber: '1',
        isPremium: false,
        status: 'DRAFT',
        deletedAt: null,
        course: { isPremium: false, status: 'PUBLISHED', deletedAt: null },
      },
    }))

    const response = await requestPdf()

    expect(response.status).toBe(404)
    expect(mocks.canAccessStudyMaterial).not.toHaveBeenCalled()
    expect(mocks.renderPdf).not.toHaveBeenCalled()
  })

  it('preserves the privileged unpublished-material preview path', async () => {
    mocks.findById.mockResolvedValue(createResource({ status: 'DRAFT' }))

    const response = await requestPdf('https://app.test/api/study-materials/material-1/pdf?preview=1')

    expect(response.status).toBe(200)
    expect(mocks.requirePermission).toHaveBeenCalledWith('manageResources')
    expect(mocks.findById).toHaveBeenCalledWith('material-1')
    expect(mocks.findPublishedById).not.toHaveBeenCalled()
    expect(mocks.canAccessStudyMaterial).not.toHaveBeenCalled()
  })

  it('denies an authenticated student requesting preview mode before querying the material', async () => {
    mocks.requirePermission.mockRejectedValue(new ForbiddenError('Permission required: manageResources'))

    const response = await requestPdf('https://app.test/api/study-materials/material-1/pdf?preview=1')

    expect(response.status).toBe(403)
    expect(mocks.requireStudent).not.toHaveBeenCalled()
    expect(mocks.requirePermission).toHaveBeenCalledWith('manageResources')
    expect(mocks.findById).not.toHaveBeenCalled()
    expect(mocks.findPublishedById).not.toHaveBeenCalled()
  })
})
