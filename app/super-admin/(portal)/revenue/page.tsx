import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import { getBillingDashboard } from "@/server/actions/billing.actions"

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
}

export default async function SuperAdminRevenuePage() {
  const dashboard = await getBillingDashboard()
  const overview = dashboard.overview
  const metrics = [
    { label: "Active subscriptions", value: overview.activeSubscriptions },
    { label: "Total subscriptions", value: overview.totalSubscriptions },
    { label: "Cancelled", value: overview.cancelledSubscriptions },
    { label: "Expired", value: overview.expiredSubscriptions },
    { label: "Estimated MRR", value: formatCurrency(overview.monthlyRecurringRevenue) },
    { label: "Estimated ARR", value: formatCurrency(overview.annualRecurringRevenue) },
    { label: "Lifetime subscriptions", value: overview.lifetimeSubscriptions },
  ]

  return (
    <div>
      <SuperAdminPageHeader title="Revenue & subscriptions" description="Subscription metrics from the existing billing dashboard service." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Subscription metrics">
        {metrics.map((metric) => <article key={metric.label} className="rounded-md border border-slate-200 bg-white p-4"><h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</h2><p className="mt-3 text-2xl font-semibold tabular-nums text-slate-950">{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</p></article>)}
      </section>
      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-950">Subscription plan distribution</h2></div>
        {Object.keys(dashboard.planDistribution).length ? (
          <ul className="divide-y divide-slate-100 sm:grid sm:grid-cols-2 sm:divide-y-0">
            {Object.entries(dashboard.planDistribution).map(([plan, count]) => <li key={plan} className="flex items-center justify-between gap-4 px-5 py-4 text-sm sm:border-b sm:border-slate-100"><span className="font-medium text-slate-800">{plan}</span><span className="tabular-nums text-slate-600">{count.toLocaleString()}</span></li>)}
          </ul>
        ) : <p className="px-5 py-8 text-sm text-slate-500">No subscription plan data is available.</p>}
      </section>
      <p className="mt-4 text-xs leading-5 text-slate-500">MRR and ARR are estimates normalized from active subscription plan prices. They are not recognized revenue or payment settlement totals.</p>
    </div>
  )
}