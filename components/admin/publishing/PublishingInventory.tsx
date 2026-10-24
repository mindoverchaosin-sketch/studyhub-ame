import Link from 'next/link'
import { getPublishingInventory } from '@/server/services/publishing-inventory.service'
import PublishingControls from '@/components/admin/publishing/PublishingControls'

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  SCHEDULED: 'Scheduled',
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  IN_REVIEW: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-blue-100 text-blue-900',
  PUBLISHED: 'bg-emerald-100 text-emerald-900',
  ARCHIVED: 'bg-rose-100 text-rose-900',
  SCHEDULED: 'bg-violet-100 text-violet-900',
}

export default async function PublishingInventory() {
  const items = await getPublishingInventory()
  const counts = items.reduce<Record<string, number>>((totals, item) => {
    totals[item.status] = (totals[item.status] ?? 0) + 1
    return totals
  }, {})

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Publishing status totals">
        {Object.entries(statusLabels).map(([status, label]) => (
          <article key={status} className="rounded-md border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h2>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{(counts[status] ?? 0).toLocaleString()}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white" aria-label="Publishing inventory">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-950">Content requiring publishing workflow</h2>
          <p className="mt-1 text-sm text-slate-600">Review and transition modules, lessons, study materials, and questions using their existing workflow rules.</p>
        </div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Content</th>
                  <th scope="col" className="px-5 py-3">Type</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Updated</th>
                  <th scope="col" className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={`${item.targetType}-${item.id}`}>
                    <td className="max-w-sm px-5 py-4">
                      <Link href={item.href} className="font-medium text-slate-900 hover:text-blue-800">{item.title}</Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{item.targetType.replaceAll('_', ' ')}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status] ?? statusStyles.DRAFT}`}>
                        {statusLabels[item.status] ?? item.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{item.updatedAt.toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <PublishingControls targetType={item.targetType} targetId={item.id} moduleId={item.moduleId} status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <h3 className="font-semibold text-slate-900">No content in the publishing inventory</h3>
            <p className="mt-2 text-sm text-slate-600">Create or import modules, lessons, study materials, or questions to start using the workflow.</p>
          </div>
        )}
      </section>
    </div>
  )
}
