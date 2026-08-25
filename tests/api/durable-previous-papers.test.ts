import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/auth'
import { mediaProvider } from '@/services/media/provider'
import { previousOfficialPaperService } from '@/server/services/previous-official-paper.service'
import type { PreviousOfficialPaperDTO } from '@/server/application/dto/previous-official-paper.dto'

vi.mock('@/auth')
vi.mock('@/services/media/provider')
vi.mock('@/server/services/previous-official-paper.service')

const studentSession: Session = {
  expires: '2099-01-01T00:00:00.000Z',
  user: { id: 'student-1', role: 'STUDENT' },
}

const createPaper = (overrides: Partial<PreviousOfficialPaperDTO> = {}): PreviousOfficialPaperDTO => ({
  id: 'paper-1',
  courseId: 'course-1',
  moduleId: 'module-1',
  courseTitle: 'Test Course',
  moduleTitle: 'Test Module',
  year: 2025,
  title: 'Test Paper',
  paperType: 'pdf',
  mediaPath: '/media/media/abc123-paper.pdf',
  isPremium: false,
  status: 'PUBLISHED',
  publishedAt: new Date('2025-01-01T00:00:00.000Z'),
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
})

describe('/api/student/previous-papers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toContain('Authentication')
  })

  it('should return 404 if paper does not exist', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toContain('not found')
  })

  it('should return 403 if premium access is denied', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce({
      paper: createPaper(),
      allowed: false,
      reason: 'Premium access required',
    })

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toContain('Premium')
  })

  it('should return 200 with PDF content if premium access allowed', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce({
      paper: createPaper(),
      allowed: true,
    })

    const testPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]) // PDF header
    vi.mocked(mediaProvider.getObject).mockResolvedValueOnce({
      body: testPdfBytes,
      mimeType: 'application/pdf',
    })

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
  })

  it('should validate media path against SSRF', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce({
      paper: createPaper({ mediaPath: 'https://evil.com/paper.pdf' }),
      allowed: true,
    })

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.error).toContain('not allowed')
  })

  it('should reject non-PDF content type', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce({
      paper: createPaper(),
      allowed: true,
    })

    vi.mocked(mediaProvider.getObject).mockResolvedValueOnce({
      body: new Uint8Array(),
      mimeType: 'text/html',
    })

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.error).toContain('content type')
  })

  it('should support same-origin redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce({
      paper: createPaper(),
      allowed: true,
    })

    const testPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46])
    vi.mocked(mediaProvider.getObject)
      .mockResolvedValueOnce({
        body: new Uint8Array(),
        mimeType: 'application/octet-stream',
        redirectPath: '/media/media/xyz789-paper.pdf',
      })
      .mockResolvedValueOnce({
        body: testPdfBytes,
        mimeType: 'application/pdf',
      })

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
  })

  it('should reject external redirects', async () => {
    vi.mocked(auth).mockResolvedValueOnce(studentSession)
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce({
      paper: createPaper(),
      allowed: true,
    })

    vi.mocked(mediaProvider.getObject).mockResolvedValueOnce({
      body: new Uint8Array(),
      mimeType: 'application/octet-stream',
      redirectPath: 'https://evil.com/paper.pdf',
    })

    const request = new Request('http://localhost:3000/api/student/previous-papers/paper-1', {
      method: 'GET',
    })

    const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
    const response = await GET(request, { params: Promise.resolve({ id: 'paper-1' }) })
    const json = await response.json()

    expect(response.status).toBe(502)
    expect(json.error).toContain('redirect is not allowed')
  })
})
