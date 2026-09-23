import { notFound, redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import PageHeader from '@/components/admin/PageHeader'
import { resourceRepository } from '@/server/repositories/resource.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { lessonRepository } from '@/server/repositories/lesson.repository'
import { defaultAeroPrepStudyDocument } from '@/lib/study-material/default-template'
import { sanitizeStudyMaterialDocument } from '@/lib/study-material/document-schema'
import { StudyMaterialWebRenderer } from '@/components/study-materials/StudyMaterialWebRenderer'

export default async function ContentEditorStudyMaterialPreviewPage({ params }: { params: Promise<{ id: string }> }) {
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
  const document = resource.documentContent ? sanitizeStudyMaterialDocument(resource.documentContent) : defaultAeroPrepStudyDocument(resource.title)
  const previewDocument = sanitizeStudyMaterialDocument({
    ...document,
    metadata: {
      ...document.metadata,
      module: document.metadata.module ?? module?.title,
      moduleNumber: document.metadata.moduleNumber ?? module?.moduleNumber,
      lesson: document.metadata.lesson ?? lesson?.title,
    },
  })

  return (
    <ContentEditorLayout>
      <div className="space-y-6">
        <PageHeader title={`Preview: ${resource.title}`} description="Preview uses the same renderer as the student view." />
        <div className="flex flex-wrap gap-3">
          <a href={`/api/study-materials/${resource.id}/pdf?preview=1`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Download PDF</a>
        </div>
        <StudyMaterialWebRenderer document={previewDocument} />
      </div>
    </ContentEditorLayout>
  )
}