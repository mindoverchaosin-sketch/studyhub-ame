import Link from "next/link"
import { redirect } from "next/navigation"
import { requireApprovedRole } from "@/auth"
import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import { getSuperAdminDashboardAction } from "@/server/actions/super-admin-dashboard.actions"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default async function SuperAdminDashboardPage() {
  try {
    await requireApprovedRole("SUPER_ADMIN")
  } catch {
    redirect("/unauthorized?reason=access-denied")
  }

  const dashboard = await getSuperAdminDashboardAction()
  const metrics = [
    { label: "Total users", value: metricsValue(dashboard.metrics.totalUsers), note: "All platform accounts" },
    { label: "Students", value: metricsValue(dashboard.metrics.students), note: "Registered learners" },
    { label: "Administrators", value: metricsValue(dashboard.metrics.administrators), note: "Admin role accounts" },
    { label: "Content editors", value: metricsValue(dashboard.metrics.contentEditors), note: "Content role accounts" },
    { label: "Pending approvals", value: metricsValue(dashboard.metrics.pendingApprovals), note: "Admin and instructor requests" },
    { label: "Published content", value: metricsValue(dashboard.metrics.publishedContent), note: "Modules, materials, questions" },
    { label: "Active exam templates", value: metricsValue(dashboard.metrics.activeExamTemplates), note: "Enabled in exam management" },
    { label: "Active subscriptions", value: metricsValue(dashboard.metrics.activeSubscriptions), note: "Current billing records" },
    { label: "Estimated MRR", value: formatCurrency(dashboard.metrics.estimatedMonthlyRecurringRevenue), note: "Based on active subscriptions" },
  ]

  return (
    <div>
      <SuperAdminPageHeader title="Platform overview" description="A live operational snapshot of accounts, content, approvals, and subscription activity." />

      <section aria-label="Platform metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {metrics.map((metric) => (
          <article key={metric.label} className="min-h-28 rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</h2>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{metric.value}</p>
            <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
          </article>
        ))}
      </section>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-950">Pending approvals</h2>
              <p className="mt-1 text-sm text-slate-500">Review admin and instructor account requests.</p>
            </div>
            <Link href="/super-admin/approvals" className="text-sm font-semibold text-blue-800 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Review queue</Link>
          </div>
          {dashboard.pendingApprovals.length ? (
            <ul className="divide-y divide-slate-100">
              {dashboard.pendingApprovals.map((approval) => (
                <li key={`${approval.role}-${approval.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{approval.name}</p>
                    <p className="truncate text-xs text-slate-500">{approval.email} · {approval.role.replaceAll("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`rounded-sm px-2 py-1 font-semibold ${approval.isActive ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{approval.isActive ? "ACTIVE" : "INACTIVE"}</span>
                    <span className="text-slate-500">{approval.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500">No pending administrator approvals.</p>
          )}
        </section>

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-950">Recent administrative activity</h2>
              <p className="mt-1 text-sm text-slate-500">Latest events recorded by the audit service.</p>
            </div>
            <Link href="/super-admin/audit-logs" className="text-sm font-semibold text-blue-800 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Open audit log</Link>
          </div>
          {dashboard.recentAuditEvents.length ? (
            <ul className="divide-y divide-slate-100">
              {dashboard.recentAuditEvents.map((event) => (
                <li key={event.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{event.action}</p>
                    <p className="truncate text-xs text-slate-500">{event.entityType} · {event.entityId ?? "No target"} · Actor {event.userId}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className={`rounded-sm px-2 py-1 text-[11px] font-semibold ${event.status === "SUCCESS" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{event.status}</span>
                    <time dateTime={event.timestamp} className="text-xs text-slate-500">{formatDate(event.timestamp)}</time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-sm text-slate-500">No administrative events have been recorded.</p>
          )}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-950">Recent registrations</h2>
            <p className="mt-1 text-sm text-slate-500">Newest user accounts from the user-management directory.</p>
          </div>
          <Link href="/super-admin/users" className="text-sm font-semibold text-blue-800 hover:text-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Browse users</Link>
        </div>
        {dashboard.recentUsers.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th scope="col" className="px-5 py-3">User</th><th scope="col" className="px-5 py-3">Role</th><th scope="col" className="px-5 py-3">Status</th><th scope="col" className="px-5 py-3">Registered</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-3"><Link href={`/super-admin/users/${user.id}`} className="font-medium text-slate-900 hover:text-blue-800">{user.displayName ?? user.email}</Link><p className="text-xs text-slate-500">{user.email}</p></td>
                    <td className="px-5 py-3 text-slate-700">{user.role}</td>
                    <td className="px-5 py-3"><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{user.status}</span></td>
                    <td className="px-5 py-3 text-slate-600">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-500">No user registrations are available.</p>
        )}
      </section>

      <p className="mt-4 text-xs text-slate-500">Updated {formatDate(dashboard.generatedAt)}. Subscription revenue is an estimate based on active plans.</p>
    </div>
  )
}

function metricsValue(value: number) {
  return new Intl.NumberFormat("en-IN").format(value)
}