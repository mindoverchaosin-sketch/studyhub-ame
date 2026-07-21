import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function AnalyticsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Placeholder content for reporting and performance insights." />
        <EmptyAdminState title="Analytics workspace" description="Analytics dashboards will be added here in a future milestone." />
      </div>
    </AdminLayout>
  );
}
