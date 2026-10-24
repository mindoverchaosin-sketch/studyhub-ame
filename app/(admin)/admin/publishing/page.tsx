import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import PageHeader from '@/features/admin/components/PageHeader'
import PublishingInventory from '@/components/admin/publishing/PublishingInventory'

export default async function AdminPublishingPage() {
  try {
    await requirePermission('publishContent')
  } catch {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publishing"
        description="Review and publish supported content from one authorized workflow queue."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Publishing' },
        ]}
      />
      <PublishingInventory />
    </div>
  )
}
