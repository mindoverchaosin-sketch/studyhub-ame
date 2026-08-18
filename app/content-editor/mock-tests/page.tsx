import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import { MockTestsManager } from '@/components/admin/cms/MockTestsManager'

export default async function MockTestsPage() {
  try {
    await requirePermission('manageModules')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  return (
    <ContentEditorLayout>
      <MockTestsManager />
    </ContentEditorLayout>
  )
}
