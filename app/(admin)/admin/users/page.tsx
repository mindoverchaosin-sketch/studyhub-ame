import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requirePermission } from '@/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';
import { listUsers } from '@/server/services/user-management.service';

export default async function AdminUsersPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    await requirePermission('manageUsers');
  } catch {
    redirect('/login');
  }

  const params = (await searchParams) ?? {};
  const query = typeof params.query === 'string' ? params.query : '';
  const role = typeof params.role === 'string' ? params.role : 'ALL';
  const status = typeof params.status === 'string' ? params.status : 'ALL';
  const page = Number(typeof params.page === 'string' ? params.page : '1') || 1;

  const users = await listUsers({ search: query, role: role as any, status: status as any, page, pageSize: 10 });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="User Management" description="Manage platform access, role assignments, and account status from one place." />
        <form method="GET" className="flex flex-wrap gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <input name="query" defaultValue={query} placeholder="Search by email or name" className="rounded-full border border-slate-300 px-3 py-2 text-sm" />
          <select name="role" defaultValue={role} className="rounded-full border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="CONTENT_EDITOR">Content Editor</option>
            <option value="STUDENT">Student</option>
          </select>
          <select name="status" defaultValue={status} className="rounded-full border border-slate-300 px-3 py-2 text-sm">
            <option value="ALL">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Apply</button>
        </form>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.items.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-950">{user.displayName ?? user.email}</div>
                    <div className="text-slate-600">{user.email}</div>
                  </td>
                  <td className="px-5 py-4">{user.role}</td>
                  <td className="px-5 py-4">{user.status}</td>
                  <td className="px-5 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
