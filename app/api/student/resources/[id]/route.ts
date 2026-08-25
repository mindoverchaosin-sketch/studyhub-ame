import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStudentResourceAccess } from '@/server/services/resource.service'
import { mediaProvider } from '@/services/media/provider'

function getAllowedMediaUrl(value: string, requestUrl: URL): URL | null {
  if (!value || value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return null

  const parsed = new URL(value, requestUrl)
  const decodedPath = decodeURIComponent(parsed.pathname)
  if (parsed.origin !== requestUrl.origin || parsed.pathname === '/media' || !parsed.pathname.startsWith('/media/') || decodedPath.split('/').includes('..')) {
    return null
  }

  return parsed
}

function isContentTypeAllowed(resourceType: string, contentType: string | null): boolean {
  if (!contentType) return false
  const mimeType = contentType.split(';', 1)[0]?.trim().toLowerCase()

  if (resourceType === 'PDF') return mimeType === 'application/pdf'
  if (resourceType === 'VIDEO') return mimeType.startsWith('video/')
  if (resourceType === 'NOTES') return mimeType === 'text/plain' || mimeType === 'text/markdown'
  return false
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
  const url = new URL(request.url)
  const lessonId = url.searchParams.get('lessonId')
  const moduleId = url.searchParams.get('moduleId')

  if (!lessonId || !moduleId) {
    return NextResponse.json({ error: 'Resource relationship is required' }, { status: 404 })
  }

  const access = await getStudentResourceAccess(session.user.id, id, lessonId, moduleId)
  if (!access) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
  }

  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? 'Premium access required' }, { status: 403 })
  }

  const requestUrl = new URL(request.url)
  const initialSourceUrl = getAllowedMediaUrl(access.resource.url, requestUrl)
  if (!initialSourceUrl) {
    return NextResponse.json({ error: 'Resource URL is not allowed' }, { status: 502 })
  }

  let sourcePath = initialSourceUrl.pathname
  let storedMedia = await mediaProvider.getObject(sourcePath)
  for (let redirectCount = 0; storedMedia?.redirectPath && redirectCount < 3; redirectCount += 1) {
    const redirectUrl = getAllowedMediaUrl(storedMedia.redirectPath, new URL(sourcePath, requestUrl))
    if (!redirectUrl) return NextResponse.json({ error: 'Resource redirect is not allowed' }, { status: 502 })
    sourcePath = redirectUrl.pathname
    storedMedia = await mediaProvider.getObject(sourcePath)
  }
  if (!storedMedia) {
    return NextResponse.json({ error: 'Resource unavailable' }, { status: 502 })
  }

  if (!isContentTypeAllowed(access.resource.type, storedMedia.mimeType)) {
    return NextResponse.json({ error: 'Resource content type is not allowed' }, { status: 502 })
  }

  const headers = new Headers()
  headers.set('content-type', storedMedia.mimeType)
  headers.set('content-disposition', 'inline')
  headers.set('cache-control', 'private, no-store')

  return new Response(storedMedia.body as unknown as BodyInit, { status: 200, headers })
}