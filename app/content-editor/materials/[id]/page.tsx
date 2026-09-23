import { notFound, redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import PageHeader from '@/components/admin/PageHeader'
import { resourceRepository } from '@/server/repositories/resource.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { lessonRepository } from '@/server/repositories/lesson.repository'
import { courseRepository } from '@/server/repositories/course.repository'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { sanitizeStudyMaterialDocument } from '@/lib/study-material/document-schema'
import { StudyMaterialEditorShell } from '@/components/content-editor/study-materials/StudyMaterialEditorShell'
import { approveStudyMaterialAction, publishStudyMaterialAction, submitStudyMaterialForReviewAction } from '@/server/actions/study-material-editorial.actions'
import Link from 'next/link'

export default async function ContentEditorStudyMaterialEditPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('manageResources')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  const { id } = await params
  const resource = await resourceRepository.findById(id)
  if (!resource) notFound()
  const [module, lesson] = await Promise.all([
    resource.moduleId ? moduleRepository.findById(resource.moduleId) : null,
    resource.lessonId ? lessonRepository.findById(resource.lessonId) : null,
  ])
  const course = module?.courseId ? await courseRepository.findById(module.courseId) : null
  const initialDoc = resource.documentContent ? sanitizeStudyMaterialDocument(resource.documentContent) : defaultAeroPrepStudyDocument(resource.title)

  return (
    <ContentEditorLayout>
      <div className="space-y-6">
        <PageHeader title={resource.title} description={`Status: ${resource.status} · ${resource.isPremium ? 'Premium' : 'Free'}`} />
        <StudyMaterialEditorShell initialDoc={initialDoc} resourceId={id} basicInformation={{ course: course?.title, module: module?.title, lesson: lesson?.title, source: resource.sourceType }} />
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-6">
          <Link href={`/content-editor/materials/${id}/preview`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Preview</Link>
          <form action={async () => { 'use server'; await submitStudyMaterialForReviewAction(id) }}><button className="rounded-xl border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700">Submit for review</button></form>
          <form action={async () => { 'use server'; await approveStudyMaterialAction(id) }}><button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Approve</button></form>
          <form action={async () => { 'use server'; await publishStudyMaterialAction(id) }}><button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Publish</button></form>
        </div>
      </div>
    </ContentEditorLayout>
  )
}