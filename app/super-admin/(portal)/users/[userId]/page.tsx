import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requireApprovedRole } from "@/auth"
import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import { getUserManagementDetail } from "@/server/services/user-management.service"

export default async function SuperAdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireApprovedRole("SUPER_ADMIN")
  } catch {
    redirect("/unauthorized?reason=access-denied")
  }

  const { userId } = await params
  const user = await getUserManagementDetail(userId)
  if (!user) notFound()

  const accountLinks = user.role === "STUDENT"
    ? [{ href: `/admin/students/${user.id}`, label: "Open student operations" }]
    : user.role === "ADMIN" || user.role === "INSTRUCTOR"
      ? [{ href: "/super-admin/approvals", label: "Open approval management" }]
      : []

  return (
    <div>
      <SuperAdminPageHeader title="User details" description="Read-only identity and account status from the existing user-management service." />
      <section className="max-w-4xl overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-950">{user.displayName ?? user.studentName ?? user.email}</h2>
            <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
          </div>
          <span className={`rounded-sm px-2.5 py-1 text-xs font-semibold ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{user.status}</span>
        </div>
        <dl className="grid gap-x-8 gap-y-5 px-5 py-6 sm:grid-cols-2">
          <Detail label="Role" value={user.role.replaceAll("_", " ")} />
          <Detail label="Account status" value={user.status} />
          <Detail label="Registered" value={new Date(user.createdAt).toLocaleString()} />
          <Detail label="Last updated" value={new Date(user.updatedAt).toLocaleString()} />
          <Detail label="Admin approval" value={user.adminApprovalStatus ?? "Not applicable"} />
          <Detail label="Instructor approval" value={user.instructorApprovalStatus ?? "Not applicable"} />
        </dl>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 px-5 py-4">
          {accountLinks.map((link) => <Link key={link.href} href={link.href} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">{link.label}</Link>)}
          <Link href="/super-admin/audit-logs" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Review audit log</Link>
        </div>
      </section>
      <p className="mt-4 max-w-4xl text-xs leading-5 text-slate-500">Role assignment and general account activation are not exposed here because no corresponding user-management mutation exists. Student status changes remain in the audited student-management workflow.</p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900">{value}</dd></div>
}