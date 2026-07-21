import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function LessonsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Lessons" description="Placeholder content for lesson management and sequencing." />
        <EmptyAdminState title="Lesson workspace" description="Lesson drafting and publishing workflows will be added here in a future milestone." />
      </div>
    </AdminLayout>
  );
}
