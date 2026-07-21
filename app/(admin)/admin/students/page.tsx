import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function StudentsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Students" description="Placeholder content for learner discovery and profile management." />
        <EmptyAdminState title="Student workspace" description="Student management workflows will be added here in a future milestone." />
      </div>
    </AdminLayout>
  );
}
