import { redirect } from "next/navigation"
import { requireApprovedRole } from "@/auth"
import ApprovalActionButtons from "@/components/super-admin/ApprovalActionButtons"
import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import { getAdminsByStatusAction, getInstructorsByStatusAction } from "@/server/actions/approval-management.actions"
import type { ApprovalStatus } from "@prisma/client"

const approvalStatuses: Array<ApprovalStatus | "ALL"> = ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"]

export default async function SuperAdminApprovalsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    await requireApprovedRole("SUPER_ADMIN")
  } catch {
    redirect("/unauthorized?reason=access-denied")
  }

  const params = (await searchParams) ?? {}
  const status = approvalStatuses.find((value) => value === params.status) ?? "ALL"
  const [admins, instructors] = await Promise.all([
    getAdminsByStatusAction(status),
    getInstructorsByStatusAction(status),
  ])

  return (
    <div>
      <SuperAdminPageHeader title="Admin approvals" description="Review administrator and instructor requests. Approval mutations retain server-side role checks, self-approval protections, and audit logging." />

      <form method="GET" className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4">
        <label className="grid gap-1 text-xs font-semibold text-slate-700">
          Approval status
          <select name="status" defaultValue={status} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            {approvalStatuses.map((value) => <option key={value} value={value}>{value === "ALL" ? "All statuses" : value}</option>)}
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Apply filter</button>
      </form>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Administrators</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{admins.length}</p>
          <p className="mt-1 text-xs text-slate-500">Accounts in this view</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Instructors</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{instructors.length}</p>
          <p className="mt-1 text-xs text-slate-500">Accounts in this view</p>
        </article>
      </div>

      <ApprovalSection title="Administrator accounts" kind="admin" accounts={admins} />
      <ApprovalSection title="Instructor accounts" kind="instructor" accounts={instructors} />
    </div>
  )
}

function ApprovalSection({ title, kind, accounts }: { title: string; kind: "admin" | "instructor"; accounts: Array<{ id: string; email: string; displayName: string | null; isActive: boolean; createdAt: Date; adminProfile?: { status: ApprovalStatus } | null; instructorProfile?: { status: ApprovalStatus } | null }> }) {
  return (
    <section className="mb-6 overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-950">{title}</h2>
      </div>
      {accounts.length ? (
        <div className="divide-y divide-slate-100">
          {accounts.map((account) => {
            const status = kind === "admin" ? account.adminProfile?.status ?? "UNKNOWN" : account.instructorProfile?.status ?? "UNKNOWN"
            return (
              <article key={account.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{account.displayName ?? account.email}</p>
                  <p className="truncate text-sm text-slate-600">{account.email}</p>
                  <p className="mt-1 text-xs text-slate-500">Requested {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(account.createdAt)} · {account.isActive ? "Account active" : "Account inactive"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : status === "PENDING" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{status}</span>
                  <ApprovalActionButtons userId={account.id} kind={kind} status={status} />
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="px-5 py-8 text-sm text-slate-500">No {kind === "admin" ? "administrator" : "instructor"} accounts match this status.</p>
      )}
    </section>
  )
}