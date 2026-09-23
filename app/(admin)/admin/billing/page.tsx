import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'import PageHeader from '@/components/admin/PageHeader'
import { getBillingDashboard } from '@/server/actions/billing.actions'

export default async function BillingDashboardPage() {
  try {
    await requirePermission('viewBillingAnalytics')
  } catch {
    redirect('/login')
  }

  const dashboard = await getBillingDashboard()

  const metricCards = [
    { label: 'Total subscriptions', value: dashboard.overview.totalSubscriptions },
    { label: 'Active subscriptions', value: dashboard.overview.activeSubscriptions },
    { label: 'Cancelled subscriptions', value: dashboard.overview.cancelledSubscriptions },
    { label: 'Expired subscriptions', value: dashboard.overview.expiredSubscriptions },
    { label: 'Estimated MRR', value: `₹${dashboard.overview.monthlyRecurringRevenue.toFixed(0)}` },
    { label: 'Estimated ARR', value: `₹${dashboard.overview.annualRecurringRevenue.toFixed(0)}` },
    { label: 'Lifetime subscriptions', value: dashboard.overview.lifetimeSubscriptions },
  ]

  const planEntries = Object.entries(dashboard.planDistribution)

  return (
    <div className="space-y-6">
        <PageHeader
          title="Billing Overview"
          description="Read-only subscription and plan health metrics for the billing dashboard."
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Plan distribution</h2>
          <p className="mt-2 text-sm text-slate-500">Current subscription mix across active plan tiers.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planEntries.length > 0 ? planEntries.map(([plan, count]) => (
              <div key={plan} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{plan}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{count}</p>
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No subscription plan data is available yet.
              </div>
            )}
          </div>
        </section>
      </div>
  )
}
