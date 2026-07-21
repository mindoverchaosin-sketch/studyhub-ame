import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardCards from "@/components/admin/DashboardCards";
import PageHeader from "@/components/admin/PageHeader";
import RecentActivity from "@/components/admin/RecentActivity";
import { getAdminStats, getRecentActivity } from "@/services/admin.service";

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const [stats, activity] = await Promise.all([getAdminStats(), getRecentActivity()]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Admin dashboard"
          description="A premium content-control workspace for modules, lessons, study materials, and operations."
        />

        <DashboardCards stats={stats} />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-6">
            <h3 className="text-lg font-semibold text-slate-950">Overview</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Placeholder metrics and activity cards are ready for future publishing workflows and analytics integrations.
            </p>
          </div>

          <RecentActivity items={activity} />
        </div>
      </div>
    </AdminLayout>
  );
}
