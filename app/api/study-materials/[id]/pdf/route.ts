import { NextResponse } from 'next/server'
import { ForbiddenError, requirePermission, requireStudent, UnauthorizedError } from '@/auth'
import type { AuthSession } from '@/lib/auth/index'
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
  let title: string
  let documentContent: unknown
  let relatedModuleNumber: string | null | undefined

  if (preview) {
    const resource = await resourceRepository.findById(id)
    if (!resource || !resource.documentContent) {
      return NextResponse.json({ error: 'Study material not found' }, { status: 404 })
    }

    title = resource.title
    documentContent = resource.documentContent
    const relatedModule = resource.moduleId ? await moduleRepository.findById(resource.moduleId) : null
    relatedModuleNumber = relatedModule?.moduleNumber
  } else {
    const resource = await resourceRepository.findPublishedById(id)
    if (!resource || !resource.documentContent) {
      return NextResponse.json({ error: 'Study material not found' }, { status: 404 })
    }

    const module = resource.module ?? resource.lesson?.module
    const lesson = resource.lesson
    if (
      !module
      || module.status !== 'PUBLISHED'
      || module.deletedAt
      || !module.course
      || module.course.status !== 'PUBLISHED'
      || module.course.deletedAt
      || (resource.moduleId && resource.moduleId !== module.id)
      || (lesson && (lesson.status !== 'PUBLISHED' || lesson.deletedAt || lesson.moduleId !== module.id))
    ) {
      return NextResponse.json({ error: 'Study material not found' }, { status: 404 })
    }

    const premiumRequired = resource.isPremium || module.isPremium || module.course.isPremium
    const access = await contentAccessService.canAccessStudyMaterial(userId, premiumRequired)
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason ?? 'Premium access required' }, { status: 403 })
    }

    title = resource.title
    documentContent = resource.documentContent
    const relatedModule = resource.module
      ?? (resource.moduleId ? await moduleRepository.findById(resource.moduleId) : null)
    relatedModuleNumber = relatedModule?.moduleNumber
  }

  const document = sanitizeStudyMaterialDocument(documentContent)
  const metadata = document.metadata
  const moduleNumber = typeof metadata.moduleNumber === 'string' && metadata.moduleNumber.trim()
    ? metadata.moduleNumber.trim()
    : relatedModuleNumber?.trim() || undefined
  const submoduleNumber = typeof metadata.submoduleNumber === 'string' && metadata.submoduleNumber.trim()
    ? metadata.submoduleNumber.trim()
    : undefined

  const pdfBytes = await renderStudyMaterialPdf(document, {
    title,
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
      'content-disposition': `attachment; filename="${(title || 'study-material').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.pdf"`,
      'cache-control': 'private, no-store',
    },
  })
}
