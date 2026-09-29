import Link from "next/link"
import { redirect } from "next/navigation"
import { requireApprovedRole } from "@/auth"
import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import { getAuditLogsAction } from "@/server/actions/audit.actions"

export default async function SuperAdminAuditLogsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    await requireApprovedRole("SUPER_ADMIN")
  } catch {
    redirect("/unauthorized?reason=access-denied")
  }

  const params = (await searchParams) ?? {}
  const search = typeof params.search === "string" ? params.search : ""
  const userId = typeof params.userId === "string" ? params.userId : ""
  const action = typeof params.action === "string" ? params.action : ""
  const entityType = typeof params.entityType === "string" ? params.entityType : ""
  const startDate = typeof params.startDate === "string" ? params.startDate : ""
  const endDate = typeof params.endDate === "string" ? params.endDate : ""
  const parsedPage = Number(typeof params.page === "string" ? params.page : "1")
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const pageSize = 20
  const result = await getAuditLogsAction({ search, userId, action, entityType, startDate: normalizeDate(startDate), endDate: normalizeDate(endDate, true), page, pageSize })
  const totalPages = Math.max(1, Math.ceil(result.total / pageSize))

  return (
    <div>
      <SuperAdminPageHeader title="Audit logs" description="Inspect privileged activity with actor, action, target, outcome, and recorded metadata." />
      <form method="GET" className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Search action or target"><input name="search" defaultValue={search} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" placeholder="Action, resource, or target ID" /></Field>
        <Field label="Actor user ID"><input name="userId" defaultValue={userId} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></Field>
        <Field label="Action"><input name="action" defaultValue={action} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" placeholder="e.g. admin.approve" /></Field>
        <Field label="Resource type"><input name="entityType" defaultValue={entityType} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></Field>
        <Field label="From"><input name="startDate" type="date" defaultValue={startDate} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></Field>
        <Field label="Through"><input name="endDate" type="date" defaultValue={endDate} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" /></Field>
        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-3">
          <button type="submit" className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Apply filters</button>
          <Link href="/super-admin/audit-logs" className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear</Link>
        </div>
      </form>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white" aria-label="Audit events">
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-600">{result.total.toLocaleString()} event(s)</div>
        {result.auditLogs.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th scope="col" className="px-4 py-3">Timestamp</th><th scope="col" className="px-4 py-3">Actor</th><th scope="col" className="px-4 py-3">Action</th><th scope="col" className="px-4 py-3">Resource / target</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Details</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.auditLogs.map((event) => (
                  <tr key={event.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600"><time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time></td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{event.userId}</p><p className="text-xs text-slate-500">{event.userRole ?? "Role not recorded"}</p></td>
                    <td className="px-4 py-3 font-medium text-slate-900">{event.action}</td>
                    <td className="px-4 py-3 text-slate-700">{event.entityType}<p className="break-all text-xs text-slate-500">{event.entityId ?? "No target ID"}</p></td>
                    <td className="px-4 py-3"><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${event.status === "SUCCESS" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{event.status}</span></td>
                    <td className="px-4 py-3">{event.metadata ? <details><summary className="cursor-pointer font-semibold text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">View</summary><pre className="mt-2 max-w-sm overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-xs text-slate-700">{JSON.stringify(event.metadata, null, 2)}</pre></details> : <span className="text-slate-400">None</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No audit events match these filters.</p>
        )}
      </section>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          {page > 1 ? <Link href={auditUrl({ search, userId, action, entityType, startDate, endDate, page: page - 1 })} className="rounded-md border border-slate-300 px-3 py-2 font-semibold hover:bg-white">Previous</Link> : null}
          {page < totalPages ? <Link href={auditUrl({ search, userId, action, entityType, startDate, endDate, page: page + 1 })} className="rounded-md border border-slate-300 px-3 py-2 font-semibold hover:bg-white">Next</Link> : null}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Actor display names are not provided by the existing audit-log query; IDs and recorded roles are shown as stored.</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-xs font-semibold text-slate-700">{label}{children}</label>
}

function auditUrl(filters: Record<string, string | number>) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => { if (value !== "") params.set(key, String(value)) })
  return `/super-admin/audit-logs?${params.toString()}`
}

function normalizeDate(value: string, endOfDay = false) {
  if (!value) return undefined
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}