import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import EmptyAdminState from "@/components/admin/EmptyAdminState";
import PageHeader from "@/components/admin/PageHeader";

export default async function OrdersPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Orders" description="Placeholder content for order review and fulfillment tracking." />
        <EmptyAdminState title="Order workspace" description="Orders and payments will be handled in a future milestone." />
      </div>
    </AdminLayout>
  );
}
