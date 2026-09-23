import { notFound, redirect } from 'next/navigation'
import { requireStudent } from '@/auth'
import { resourceRepository } from '@/server/repositories/resource.repository'
import { contentAccessService } from '@/server/services/content-access.service'
import { sanitizeStudyMaterialDocument } from '@/lib/study-material/document-schema'
import { StudyMaterialWebRenderer } from '@/components/study-materials/StudyMaterialWebRenderer'

export default async function StudentStudyMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStudent()
  const { id } = await params
  const resource = await resourceRepository.findPublishedById(id)
  if (!resource || !resource.documentContent) notFound()
  const access = await contentAccessService.canAccessStudyMaterial(session.user.id, resource.isPremium)
  if (!access.allowed) redirect(`/student/dashboard/billing?reason=resource-access&feature=${access.requiredFeature ?? 'premiumModules'}`)
  const document = sanitizeStudyMaterialDocument(resource.documentContent)
  const studentDocument = sanitizeStudyMaterialDocument({
    ...document,
    metadata: {
      ...document.metadata,
      module: document.metadata.module ?? resource.module?.title,
      moduleNumber: document.metadata.moduleNumber ?? resource.module?.moduleNumber,
      lesson: document.metadata.lesson ?? resource.lesson?.title,
    },
  })
  return <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6"><div className="mx-auto mb-4 max-w-4xl flex justify-end"><a href={`/api/study-materials/${resource.id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Download PDF</a></div><StudyMaterialWebRenderer document={studentDocument} /></main>
}
