import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { getStudentDirectoryAction } from "@/server/actions/student-management.actions";

export default async function StudentsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    await requirePermission('manageStudents');
  } catch {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const query = typeof params.query === "string" ? params.query : "";
  const status = typeof params.status === "string" ? params.status : "ALL";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const pageSize = 10;

  const directory = await getStudentDirectoryAction({
    search: query,
    status: status === "ACTIVE" || status === "SUSPENDED" ? status : "ALL",
    page,
    pageSize,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Students"
          description="Review enrolled learners, monitor account health, and manage student access from a single workspace."
          actions={
            <form method="GET" className="flex flex-wrap gap-3">
              <input
                name="query"
                defaultValue={query}
                placeholder="Search name or email"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-slate-500"
              />
              <select
                name="status"
                defaultValue={status}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-slate-500"
              >
                <option value="ALL">All status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Apply
              </button>
            </form>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total students</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{directory.summary.totalCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Active</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{directory.summary.activeCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Suspended</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{directory.summary.suspendedCount}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Registered</th>
                  <th className="px-5 py-4">Last active</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directory.items.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-950">{student.fullName}</div>
                      <div className="text-slate-600">{student.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${student.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-slate-600">{new Date(student.lastActiveAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/students/${student.id}`} className="text-sm font-semibold text-slate-900 hover:text-slate-600">
                        View profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Showing page {directory.pagination.page} of {directory.pagination.totalPages}</p>
          <div className="flex gap-2">
            {directory.pagination.page > 1 ? (
              <Link href={`/admin/students?query=${encodeURIComponent(query)}&status=${status}&page=${directory.pagination.page - 1}`} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                Previous
              </Link>
            ) : null}
            {directory.pagination.page < directory.pagination.totalPages ? (
              <Link href={`/admin/students?query=${encodeURIComponent(query)}&status=${status}&page=${directory.pagination.page + 1}`} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
