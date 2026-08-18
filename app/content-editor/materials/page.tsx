import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import PageHeader from '@/components/admin/PageHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'

export default async function MaterialsPage() {
  try {
    await requirePermission('manageResources')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  return (
    <ContentEditorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Study materials"
          description="Create, edit, and manage study materials, PDFs, and educational resources."
        />
        <EmptyAdminState
          title="Materials workspace"
          description="Study material management interface will be available here. You have permission to manage resources."
        />
      </div>
    </ContentEditorLayout>
  )
}
