import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForbiddenError, requireStudent, UnauthorizedError } from '@/auth'
import { mediaProvider } from '@/services/media/provider'
import { previousOfficialPaperService } from '@/server/services/previous-official-paper.service'

vi.mock('@/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/auth')>()
  return { ...actual, requireStudent: vi.fn() }
})
vi.mock('@/services/media/provider')
vi.mock('@/server/services/previous-official-paper.service')

const paperAccess = {
  paper: { mediaPath: '/media/media/paper.pdf', paperType: 'Official PDF' },
  allowed: true,
}

async function requestPaper() {
  const { GET } = await import('@/app/api/student/previous-papers/[id]/route')
  return GET(
    new Request('https://app.test/api/student/previous-papers/paper-1'),
    { params: Promise.resolve({ id: 'paper-1' }) },
  )
}

describe('/api/student/previous-papers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireStudent).mockResolvedValue({
      expires: '2099-01-01T00:00:00.000Z',
      user: { id: 'student-1', role: 'STUDENT' },
    })
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValue(paperAccess as never)
    vi.mocked(mediaProvider.getObject).mockResolvedValue({
      body: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
      mimeType: 'application/pdf',
    } as never)
  })

  it('rejects anonymous requests before loading paper data', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new UnauthorizedError())

    const response = await requestPaper()

    expect(response.status).toBe(401)
    expect(previousOfficialPaperService.getStudentAccess).not.toHaveBeenCalled()
    expect(mediaProvider.getObject).not.toHaveBeenCalled()
  })

  it('rejects authenticated non-students before loading paper data', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new ForbiddenError('Student access required.'))

    const response = await requestPaper()

    expect(response.status).toBe(403)
    expect(previousOfficialPaperService.getStudentAccess).not.toHaveBeenCalled()
  })

  it('delivers free paper content when the server-side access service allows it', async () => {
    const response = await requestPaper()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(previousOfficialPaperService.getStudentAccess).toHaveBeenCalledWith('student-1', 'paper-1')
    expect(mediaProvider.getObject).toHaveBeenCalledWith('/media/media/paper.pdf')
  })

  it('denies premium paper content before reading media when access is not allowed', async () => {
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce({
      ...paperAccess,
      allowed: false,
      reason: 'Premium module access required',
    } as never)

    const response = await requestPaper()

    expect(response.status).toBe(403)
    expect(mediaProvider.getObject).not.toHaveBeenCalled()
  })

  it('does not distinguish missing or unpublished papers', async () => {
    vi.mocked(previousOfficialPaperService.getStudentAccess).mockResolvedValueOnce(null)

    const response = await requestPaper()

    expect(response.status).toBe(404)
    expect(mediaProvider.getObject).not.toHaveBeenCalled()
  })
})
