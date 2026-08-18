import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import PageHeader from '@/components/admin/PageHeader'
import { LessonsManager } from '@/components/admin/cms/LessonsManager'

export default async function LessonsPage() {
  try {
    await requirePermission('manageModules')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  return (
    <ContentEditorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Lesson management"
          description="Create, edit, and manage individual lessons within modules."
        />
        <LessonsManager />
      </div>
    </ContentEditorLayout>
  )
}
