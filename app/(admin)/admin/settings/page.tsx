import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function SettingsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Settings" description="Placeholder content for platform configuration and preferences." />
        <EmptyAdminState title="Settings workspace" description="Site settings and workflow configuration will be added here in a future milestone." />
      </div>
    </AdminLayout>
  );
}
