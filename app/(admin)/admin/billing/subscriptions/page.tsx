import { redirect } from 'next/navigation'import PageHeader from '@/components/admin/PageHeader'
import { requirePermission } from '@/auth'
import { getSubscriptions } from '@/server/actions/billing.actions'

export default async function SubscriptionDirectoryPage() {
  try {
    await requirePermission('manageBilling')
  } catch {
    redirect('/login')
  }

  const subscriptions = await getSubscriptions({ page: 1, pageSize: 20 })

  return (
    <div className="space-y-6">
        <PageHeader
          title="Subscription management"
          description="Review active subscriptions, lifecycle states, and renewals for enrolled students."
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Starts</th>
                  <th className="px-3 py-3">Renewal</th>
                  <th className="px-3 py-3">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{subscription.studentName}</div>
                      <div className="text-slate-500">{subscription.studentEmail}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{subscription.planName}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${subscription.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : subscription.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' : subscription.status === 'CANCELLED' ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{new Date(subscription.currentPeriodStart).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-slate-600">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</td>
                    <td className="px-3 py-3 text-slate-600">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
  )
}
