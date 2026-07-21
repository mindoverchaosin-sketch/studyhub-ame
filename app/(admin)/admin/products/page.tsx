import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function ProductsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Products" description="Placeholder content for digital product and bundle management." />
        <EmptyAdminState title="Product workspace" description="Product setup and catalog workflows will be added here in a future milestone." />
      </div>
    </AdminLayout>
  );
}
