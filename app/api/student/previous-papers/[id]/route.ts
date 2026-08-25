import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { previousOfficialPaperService } from '@/server/services/previous-official-paper.service'
import { mediaProvider } from '@/services/media/provider'

const MAX_REDIRECTS = 3

function getAllowedMediaUrl(value: string, requestUrl: URL): URL | null {
  if (!value || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return null
  const parsed = new URL(value, requestUrl)
  const decodedPath = decodeURIComponent(parsed.pathname)
  if (parsed.origin !== requestUrl.origin || parsed.pathname === '/media' || !parsed.pathname.startsWith('/media/') || decodedPath.split('/').includes('..')) {
    return null
  }
  return parsed
}

function isAllowedPaperContentType(paperType: string, contentType: string | null): boolean {
  if (!contentType) return false
  const mimeType = contentType.split(';', 1)[0]?.trim().toLowerCase()
  return mimeType === 'application/pdf' && (paperType.toLowerCase().includes('pdf') || paperType.toLowerCase().includes('official'))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await params
  const access = await previousOfficialPaperService.getStudentAccess(session.user.id, id)
  if (!access) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
  }
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? 'Premium access required' }, { status: 403 })
  }

  const requestUrl = new URL(request.url)
  const initialSourceUrl = getAllowedMediaUrl(access.paper.mediaPath, requestUrl)
  if (!initialSourceUrl) {
    return NextResponse.json({ error: 'Paper media path is not allowed' }, { status: 502 })
  }

  let sourcePath = initialSourceUrl.pathname
  let storedMedia = await mediaProvider.getObject(sourcePath)
  for (let redirectCount = 0; storedMedia?.redirectPath && redirectCount < MAX_REDIRECTS; redirectCount += 1) {
    const redirectUrl = getAllowedMediaUrl(storedMedia.redirectPath, new URL(sourcePath, requestUrl))
    if (!redirectUrl) return NextResponse.json({ error: 'Paper redirect is not allowed' }, { status: 502 })
    sourcePath = redirectUrl.pathname
    storedMedia = await mediaProvider.getObject(sourcePath)
  }
  if (!storedMedia) {
    return NextResponse.json({ error: 'Paper unavailable' }, { status: 502 })
  }
  if (!isAllowedPaperContentType(access.paper.paperType, storedMedia.mimeType)) {
    return NextResponse.json({ error: 'Paper content type is not allowed' }, { status: 502 })
  }

  const headers = new Headers({
    'content-type': 'application/pdf',
    'content-disposition': 'inline',
    'cache-control': 'private, no-store',
  })
  return new Response(storedMedia.body as unknown as BodyInit, { status: 200, headers })
}
