import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import PublishingInventory from "@/components/admin/publishing/PublishingInventory"

export default function SuperAdminPublishingPage() {
  return (
    <div className="space-y-6">
      <SuperAdminPageHeader title="Publishing" description="Review and publish supported content from the central workflow queue." />
      <PublishingInventory />
    </div>
  )
}
