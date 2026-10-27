import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { UnauthorizedError } from '@/auth'
import { mediaProvider } from '@/services/media/provider'

const { requireStudentMock, accessMock } = vi.hoisted(() => ({
  requireStudentMock: vi.fn(),
  accessMock: vi.fn(),
}))
vi.mock('@/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/auth')>()
  return { ...actual, requireStudent: requireStudentMock }
})
vi.mock('@/server/services/previous-official-paper.service', () => ({ previousOfficialPaperService: { getStudentAccess: accessMock } }))

const paper = { id: 'paper-1', courseId: 'course-1', moduleId: 'module-1', year: 2025, title: 'Official Paper', paperType: 'Official PDF', mediaPath: '/media/paper.pdf', isPremium: false, status: 'PUBLISHED' as const, courseTitle: 'DGCA', moduleTitle: 'Air Navigation', publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }

describe('previous official paper view route', () => {
  let getObjectSpy: MockInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    getObjectSpy = vi.spyOn(mediaProvider, 'getObject')
    await mediaProvider.storeBytes?.('/media/paper.pdf', new TextEncoder().encode('%PDF-1.7 test'), 'application/pdf')
  })

  async function getRoute() {
    return import('@/app/api/student/previous-papers/[id]/route')
  }

  it('denies unauthenticated requests', async () => {
    requireStudentMock.mockRejectedValue(new UnauthorizedError())
    const { GET } = await getRoute()
    const response = await GET(new Request('https://app.test/api/student/previous-papers/paper-1'), { params: Promise.resolve({ id: 'paper-1' }) })
    expect(response.status).toBe(401)
    expect(accessMock).not.toHaveBeenCalled()
  })

  it('denies missing, draft, archived, or deleted papers', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    accessMock.mockResolvedValue(null)
    const { GET } = await getRoute()
    const response = await GET(new Request('https://app.test/api/student/previous-papers/paper-1'), { params: Promise.resolve({ id: 'paper-1' }) })
    expect(response.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
    expect(getObjectSpy).not.toHaveBeenCalled()
  })

  it('denies premium papers without premiumModules', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    accessMock.mockResolvedValue({ paper: { ...paper, isPremium: true }, allowed: false, requiredFeature: 'premiumModules' })
    const { GET } = await getRoute()
    const response = await GET(new Request('https://app.test/api/student/previous-papers/paper-1'), { params: Promise.resolve({ id: 'paper-1' }) })
    expect(response.status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
    expect(getObjectSpy).not.toHaveBeenCalled()
  })

  it('allows a free or entitled paper through the protected boundary', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    accessMock.mockResolvedValue({ paper, allowed: true })
    const { GET } = await getRoute()
    const response = await GET(new Request('https://app.test/api/student/previous-papers/paper-1'), { params: Promise.resolve({ id: 'paper-1' }) })
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('%PDF-1.7 test')
  })

  it.each(['https://example.com/paper.pdf', 'http://127.0.0.1/paper.pdf', 'http://169.254.169.254/latest/meta-data', 'file:///etc/passwd'])('rejects unsafe media path %s', async (mediaPath) => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    accessMock.mockResolvedValue({ paper: { ...paper, mediaPath }, allowed: true })
    const { GET } = await getRoute()
    const response = await GET(new Request('https://app.test/api/student/previous-papers/paper-1'), { params: Promise.resolve({ id: 'paper-1' }) })
    expect(response.status).toBe(502)
    expect(fetch).not.toHaveBeenCalled()
    expect(getObjectSpy).not.toHaveBeenCalled()
  })

  it('rejects unsafe redirects and mismatched MIME types', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    accessMock.mockResolvedValue({ paper, allowed: true })
    vi.spyOn(mediaProvider, 'getObject').mockResolvedValueOnce({ body: new Uint8Array(), mimeType: 'application/pdf', redirectPath: 'http://127.0.0.1/admin' })
    const { GET } = await getRoute()
    const redirectResponse = await GET(new Request('https://app.test/api/student/previous-papers/paper-1'), { params: Promise.resolve({ id: 'paper-1' }) })
    expect(redirectResponse.status).toBe(502)

    vi.spyOn(mediaProvider, 'getObject').mockResolvedValue({ body: new TextEncoder().encode('<html>'), mimeType: 'text/html' })
    const mimeResponse = await GET(new Request('https://app.test/api/student/previous-papers/paper-1'), { params: Promise.resolve({ id: 'paper-1' }) })
    expect(mimeResponse.status).toBe(502)
  })
})
