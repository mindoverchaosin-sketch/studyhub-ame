import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function MockTestsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Mock tests" description="Placeholder content for mock test orchestration." />
        <EmptyAdminState title="Mock test workspace" description="Mock test management flows will be added here in a future milestone." />
      </div>
    </AdminLayout>
  );
}
