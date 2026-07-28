import { redirect } from "next/navigation";
import { requirePermission } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import { getDashboardSummaryAction } from "@/server/actions/admin-dashboard.actions";

export default async function AdminDashboardPage() {
  try {
    await requirePermission('viewAnalytics');
  } catch {
    redirect("/login");
  }

  const dashboard = await getDashboardSummaryAction();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-[0_25px_80px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">Enterprise Admin Portal</p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Operational overview for learning and content teams</h1>
              <p className="mt-4 text-base text-slate-300">
                Monitor student engagement, content depth, assessment activity, and system health from a single control surface.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-sm text-slate-300">System Status</p>
              <p className="mt-2 text-2xl font-semibold">{dashboard.health.status.toUpperCase()}</p>
              <p className="mt-1 text-sm text-slate-400">v{dashboard.health.version}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
            <p className="text-sm text-slate-500">Executive snapshot</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.summaryCards.map((card) => (
              <div key={card.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-4 text-3xl font-semibold text-slate-950">{card.value}</p>
                {card.description ? <p className="mt-2 text-sm text-slate-500">{card.description}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-xl font-semibold text-slate-900">Learning Platform</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dashboard.sections.learning.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-xl font-semibold text-slate-900">Students</h2>
            <div className="mt-6 space-y-3">
              {dashboard.sections.students.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-xl font-semibold text-slate-900">Content</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {dashboard.sections.content.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-xl font-semibold text-slate-900">System</h2>
            <div className="mt-6 space-y-3">
              {dashboard.sections.system.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
              <p className="mt-2 text-sm text-slate-500">Entry points for the next admin modules.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {dashboard.sections.quickActions.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{item.value}</p>
                  {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
