import { NextResponse } from 'next/server'
import { ForbiddenError, requirePermission, requireStudent, UnauthorizedError, type AuthSession } from '@/auth'
import { resourceRepository } from '@/server/repositories/resource.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { contentAccessService } from '@/server/services/content-access.service'
import { sanitizeStudyMaterialDocument } from '@/lib/study-material/document-schema'
import { renderStudyMaterialPdf } from '@/lib/study-material/pdf-renderer'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const preview = new URL(_request.url).searchParams.get('preview') === '1'
  let session: AuthSession
  try {
    session = preview
      ? await requirePermission('manageResources')
      : await requireStudent()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw error
  }

  const userId = session.user.id
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await params
  const resource = preview ? await resourceRepository.findById(id) : await resourceRepository.findPublishedById(id)
  if (!resource || !resource.documentContent) {
    return NextResponse.json({ error: 'Study material not found' }, { status: 404 })
  }

  if (!preview) {
    const access = await contentAccessService.canAccessStudyMaterial(userId, resource.isPremium)
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason ?? 'Premium access required' }, { status: 403 })
    }
  }

  const document = sanitizeStudyMaterialDocument(resource.documentContent)
  const relatedModule = (resource as { module?: { moduleNumber?: string | null } }).module
    ?? (resource.moduleId ? await moduleRepository.findById(resource.moduleId) : null)
  const metadata = (document.metadata ?? {}) as Record<string, unknown>
  const moduleNumber = typeof metadata.moduleNumber === 'string' && metadata.moduleNumber.trim()
    ? metadata.moduleNumber.trim()
    : relatedModule?.moduleNumber?.trim() || undefined
  const submoduleNumber = typeof metadata.submoduleNumber === 'string' && metadata.submoduleNumber.trim()
    ? metadata.submoduleNumber.trim()
    : undefined

  const pdfBytes = await renderStudyMaterialPdf(document, {
    title: resource.title,
    author: 'AeroPrep',
    context: {
      moduleNumber,
      submoduleNumber,
    },
  })

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${(resource.title || 'study-material').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.pdf"`,
      'cache-control': 'private, no-store',
    },
  })
}
