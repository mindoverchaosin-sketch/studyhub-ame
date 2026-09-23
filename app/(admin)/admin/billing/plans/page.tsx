import { redirect } from 'next/navigation'import PageHeader from '@/components/admin/PageHeader'
import { requirePermission } from '@/auth'
import { getPlans } from '@/server/actions/billing.actions'

export default async function BillingPlansPage() {
  try {
    await requirePermission('manageBilling')
  } catch {
    redirect('/login')
  }

  const plans = await getPlans()

  return (
    <div className="space-y-6">
        <PageHeader
          title="Plan management"
          description="Manage plan availability, pricing, ordering, and feature visibility for billing tiers."
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Subscription plans</h2>
              <p className="mt-2 text-sm text-slate-500">{plans.total} plan{plans.total === 1 ? '' : 's'} available in the admin catalog.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {plans.plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{plan.slug}</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{plan.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold text-slate-950">₹{plan.price.toFixed(0)}</p>
                    <p className="text-sm text-slate-500">{plan.interval}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p>Display order: {plan.displayOrder}</p>
                    <p>{plan.features.length} feature{plan.features.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
  )
}
