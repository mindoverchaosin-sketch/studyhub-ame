import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import PageHeader from '@/components/admin/PageHeader'
import Link from 'next/link'
import StudyMaterialCmsList from '@/components/admin/StudyMaterialCmsList'
import { resourceRepository } from '@/server/repositories/resource.repository'

export default async function MaterialsPage() {
  try {
    await requirePermission('manageResources')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  const resources = await resourceRepository.findForAdmin({})
  return (
    <ContentEditorLayout>
      <div className="space-y-6">
        <PageHeader title="Study materials" description="Create, edit, and manage structured study materials." />
        <div className="flex justify-end"><Link href="/admin/materials/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">New study material</Link></div>
        <StudyMaterialCmsList basePath="/content-editor" resources={resources.map((resource) => ({ id: resource.id, moduleId: resource.moduleId, lessonId: resource.lessonId, title: resource.title, description: null, type: resource.materialType, url: resource.url ?? '', isPremium: resource.isPremium, status: resource.status, publishedAt: resource.publishedAt, createdAt: resource.createdAt, updatedAt: resource.updatedAt }))} />
      </div>
    </ContentEditorLayout>
  )
}
