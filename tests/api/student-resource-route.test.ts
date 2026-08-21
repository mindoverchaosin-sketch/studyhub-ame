import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const getStudentResourceAccessMock = vi.fn()

vi.mock('@/auth', () => ({ auth: authMock }))
vi.mock('@/server/services/resource.service', () => ({
  getStudentResourceAccess: getStudentResourceAccessMock,
}))

const resource = {
  id: 'resource-1',
  moduleId: 'module-1',
  lessonId: 'lesson-1',
  title: 'Study guide',
  description: null,
  type: 'PDF',
  url: '/media/study-guide.pdf',
  isPremium: false,
  status: 'PUBLISHED' as const,
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('student resource view route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('content', {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    })))
  })

  it('denies unauthenticated access', async () => {
    authMock.mockResolvedValue(null)
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(401)
    expect(getStudentResourceAccessMock).not.toHaveBeenCalled()
  })

  it('denies a guessed resource when its lesson/module relationship is invalid', async () => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue(null)
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=other&moduleId=other'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    ['unpublished', null],
    ['archived/deleted', null],
  ])('excludes %s resources', async (_label, access) => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue(access)
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(404)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('allows a free published resource through the protected boundary', async () => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue({ resource, allowed: true })
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith(new URL('https://app.test/media/study-guide.pdf'), { redirect: 'manual' })
  })

  it('denies premium access without premiumModules', async () => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue({ resource: { ...resource, isPremium: true }, allowed: false, requiredFeature: 'premiumModules', reason: 'Premium module access required to view this material' })
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('allows premium access with premiumModules', async () => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue({ resource: { ...resource, isPremium: true }, allowed: true, requiredFeature: 'premiumModules' })
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalled()
  })

  it.each([
    'https://example.com/resource.pdf',
    'http://localhost/resource.pdf',
    'http://127.0.0.1/resource.pdf',
    'http://10.0.0.1/resource.pdf',
    'http://169.254.169.254/latest/meta-data',
    'file:///etc/passwd',
    'ftp://example.com/resource.pdf',
  ])('rejects unsafe stored URL %s', async (unsafeUrl) => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue({ resource: { ...resource, url: unsafeUrl }, allowed: true })
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(502)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a redirect to an internal target', async () => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue({ resource, allowed: true })
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } }))
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(502)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('rejects a mismatched returned content type', async () => {
    authMock.mockResolvedValue({ user: { id: 'student-1' } })
    getStudentResourceAccessMock.mockResolvedValue({ resource: { ...resource, type: 'VIDEO' }, allowed: true })
    vi.mocked(fetch).mockResolvedValue(new Response('not video', { status: 200, headers: { 'content-type': 'text/plain' } }))
    const { GET } = await import('@/app/api/student/resources/[id]/route')

    const response = await GET(new Request('https://app.test/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1'), { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(502)
  })
})