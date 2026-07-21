import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function MaterialsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Study materials" description="Placeholder content for resource uploads and organization." />
        <EmptyAdminState title="Materials workspace" description="Material management flows will be added here in a future milestone." />
      </div>
    </AdminLayout>
  );
}
