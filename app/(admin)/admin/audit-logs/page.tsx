import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'import PageHeader from '@/components/admin/PageHeader'
import { getAuditLogsAction } from '@/server/actions/audit.actions'

export default async function AuditLogsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    await requirePermission('manageAuditLogs')
  } catch {
    redirect('/login')
  }

  const params = (await searchParams) ?? {}
  const search = typeof params.search === 'string' ? params.search : ''
  const action = typeof params.action === 'string' ? params.action : ''
  const entityType = typeof params.entityType === 'string' ? params.entityType : ''
  const userId = typeof params.userId === 'string' ? params.userId : ''
  const page = Number(typeof params.page === 'string' ? params.page : '1') || 1
  const pageSize = 20

  const result = await getAuditLogsAction({ search, userId, action, entityType, page, pageSize })

  return (
    <div className="space-y-6">
        <PageHeader
          title="Audit logs"
          description="Review privileged admin activity for governance, troubleshooting, and change tracking."
        />

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent privileged actions</h2>
              <p className="mt-1 text-sm text-slate-600">Newest entries are shown first and include the actor, action, entity, and outcome.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {result.auditLogs.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="px-4 py-3 text-slate-700">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.userId}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.action}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.entityType}:{entry.entityId}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  )
}
