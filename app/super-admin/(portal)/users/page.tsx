import Link from "next/link"
import { redirect } from "next/navigation"
import { requireApprovedRole } from "@/auth"
import AddUserDialog from "@/components/super-admin/AddUserDialog"
import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import { listUsers, type UserManagementRoleFilter, type UserManagementStatus } from "@/server/services/user-management.service"

const roles: UserManagementRoleFilter[] = ["ALL", "SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "CONTENT_EDITOR", "STUDENT"]
const statuses: Array<"ALL" | UserManagementStatus> = ["ALL", "ACTIVE", "SUSPENDED"]

export default async function SuperAdminUsersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    await requireApprovedRole("SUPER_ADMIN")
  } catch {
    redirect("/unauthorized?reason=access-denied")
  }

  const params = (await searchParams) ?? {}
  const query = typeof params.query === "string" ? params.query : ""
  const role = roles.find((value) => value === params.role) ?? "ALL"
  const status = statuses.find((value) => value === params.status) ?? "ALL"
  const requestedPage = Number(typeof params.page === "string" ? params.page : "1")
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const users = await listUsers({ search: query, role, status, page, pageSize: 20 })

  return (
    <div>
      <SuperAdminPageHeader title="Users" description="Search and review platform accounts. Admin and Instructor accounts enter their existing approval workflows when created." />
      <div className="mb-5 flex justify-end">
        <AddUserDialog />
      </div>

      <form method="GET" className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-white p-4">
        <label className="grid min-w-52 flex-1 gap-1 text-xs font-semibold text-slate-700">
          Name or email
          <input name="query" defaultValue={query} placeholder="Search accounts" className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-700">
          Role
          <select name="role" defaultValue={role} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value="ALL">All roles</option><option value="SUPER_ADMIN">Super Admin</option><option value="ADMIN">Admin</option><option value="INSTRUCTOR">Instructor</option><option value="CONTENT_EDITOR">Content Editor</option><option value="STUDENT">Student</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-700">
          Account status
          <select name="status" defaultValue={status} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Search</button>
      </form>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white" aria-label="User results">
        <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-600">{users.totalItems.toLocaleString()} account(s)</div>
        {users.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th scope="col" className="px-5 py-3">Account</th><th scope="col" className="px-5 py-3">Role</th><th scope="col" className="px-5 py-3">Status</th><th scope="col" className="px-5 py-3">Registered</th><th scope="col" className="px-5 py-3"><span className="sr-only">Details</span></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3"><Link href={`/super-admin/users/${user.id}`} className="font-semibold text-slate-900 hover:text-blue-800">{user.displayName ?? user.email}</Link><p className="text-xs text-slate-500">{user.email}</p></td>
                    <td className="px-5 py-3 text-slate-700">{user.role.replaceAll("_", " ")}</td>
                    <td className="px-5 py-3"><span className={`rounded-sm px-2 py-1 text-xs font-semibold ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{user.status}</span></td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td>
                    <td className="whitespace-nowrap px-5 py-3"><Link href={`/super-admin/users/${user.id}`} className="font-semibold text-blue-800 hover:text-blue-950">View details</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No users match these filters.</p>
        )}
      </section>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
        <span>Page {users.page} of {users.totalPages}</span>
        <div className="flex gap-2">
          {users.page > 1 ? <Link href={usersUrl(query, role, status, users.page - 1)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold hover:bg-white">Previous</Link> : null}
          {users.page < users.totalPages ? <Link href={usersUrl(query, role, status, users.page + 1)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold hover:bg-white">Next</Link> : null}
        </div>
      </div>
    </div>
  )
}

function usersUrl(query: string, role: UserManagementRoleFilter, status: "ALL" | UserManagementStatus, page: number) {
  const params = new URLSearchParams({ query, role, status, page: String(page) })
  return `/super-admin/users?${params.toString()}`
}