import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Session } from 'next-auth'
import { auth } from '@/auth'
import { mediaProvider } from '@/services/media/provider'
import { getStudentResourceAccess } from '@/server/services/resource.service'
import type { ResourceDTO } from '@/server/application/dto/resource.dto'

vi.mock('@/auth')
vi.mock('@/services/media/provider')
vi.mock('@/server/services/resource.service')

const studentSession: Session = {
  expires: '2099-01-01T00:00:00.000Z',
  user: { id: 'student-1', role: 'STUDENT' },
}

const createResource = (overrides: Partial<ResourceDTO> = {}): ResourceDTO => ({
  id: 'resource-1',
  moduleId: 'module-1',
  lessonId: 'lesson-1',
  title: 'Test Resource',
  description: null,
  type: 'PDF',
  url: '/media/media/abc123-resource.pdf',
  isPremium: false,
  status: 'PUBLISHED',
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
})

describe('/api/student/resources/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toContain('Authentication')
  })

  it('should return 404 if resource parameters missing', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)

    const request = new Request('http://localhost:3000/api/student/resources/resource-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toContain('required')
  })

  it('should return 404 if resource not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toContain('not found')
  })

  it('should return 403 if premium access denied', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource({ url: '/media/media/abc123-notes.txt', type: 'NOTES' }),
      allowed: false,
      reason: 'Premium access required',
    })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toContain('Premium')
  })

  it('should return 200 with PDF content', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource(),
      allowed: true,
    })

    const testPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    vi.mocked(mediaProvider.getObject).mockResolvedValueOnce({
      body: testPdfBytes,
      mimeType: 'application/pdf',
    })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
  })

  it('should return video content when allowed', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource({ url: '/media/media/abc123-lesson.mp4', type: 'VIDEO' }),
      allowed: true,
    })

    const testVideoBytes = new Uint8Array([0x00, 0x00, 0x00, 0x20])
    vi.mocked(mediaProvider.getObject).mockResolvedValueOnce({
      body: testVideoBytes,
      mimeType: 'video/mp4',
    })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('video/mp4')
  })

  it('should validate media URL against SSRF', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource({ url: 'https://evil.com/resource.pdf' }),
      allowed: true,
    })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.error).toContain('not allowed')
  })

  it('should reject mismatched content type', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource(),
      allowed: true,
    })

    vi.mocked(mediaProvider.getObject).mockResolvedValueOnce({
      body: new Uint8Array(),
      mimeType: 'text/html',
    })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.error).toContain('content type')
  })

  it('should support same-origin redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource(),
      allowed: true,
    })

    const testBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    vi.mocked(mediaProvider.getObject)
      .mockResolvedValueOnce({
        body: new Uint8Array(),
        mimeType: 'application/octet-stream',
        redirectPath: '/media/media/xyz789-resource.pdf',
      })
      .mockResolvedValueOnce({
        body: testBytes,
        mimeType: 'application/pdf',
      })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
  })

  it('should reject external redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource(),
      allowed: true,
    })

    vi.mocked(mediaProvider.getObject).mockResolvedValueOnce({
      body: new Uint8Array(),
      mimeType: 'application/octet-stream',
      redirectPath: 'https://evil.com/resource.pdf',
    })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.error).toContain('redirect is not allowed')
  })

  // Ported from the retired fetch-proxy suite: lesson/module binding.
  it('should return 404 when the lesson or module does not match the resource', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-9&moduleId=module-9', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(mediaProvider.getObject).not.toHaveBeenCalled()
  })

  // Ported: unpublished and archived/deleted resources never resolve.
  it.each([
    ['unpublished', null],
    ['archived/deleted', null],
  ])('excludes %s resources from student delivery', async (_label, access) => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce(access as never)

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })

    expect(response.status).toBe(404)
    expect(mediaProvider.getObject).not.toHaveBeenCalled()
  })

  // Ported: the full unsafe stored-URL matrix must reject without any
  // storage retrieval attempt.
  it.each([
    'https://example.com/resource.pdf',
    'http://localhost/resource.pdf',
    'http://127.0.0.1/resource.pdf',
    'http://10.0.0.1/resource.pdf',
    'http://169.254.169.254/latest/meta-data',
    'file:///etc/passwd',
    'ftp://example.com/resource.pdf',
  ])('rejects unsafe stored URL %s', async (unsafeUrl) => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(getStudentResourceAccess).mockResolvedValueOnce({
      resource: createResource({ url: unsafeUrl }),
      allowed: true,
    })

    const request = new Request('http://localhost:3000/api/student/resources/resource-1?lessonId=lesson-1&moduleId=module-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/resources/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'resource-1' }) })
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.error).toContain('not allowed')
    expect(mediaProvider.getObject).not.toHaveBeenCalled()
  })
})
