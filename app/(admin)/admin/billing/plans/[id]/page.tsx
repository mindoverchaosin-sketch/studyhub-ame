import Link from 'next/link'
import { redirect } from 'next/navigation'import PageHeader from '@/components/admin/PageHeader'
import { requirePermission } from '@/auth'
import { getPlan } from '@/server/actions/billing.actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BillingPlanDetailPage({ params }: Props) {
  try {
    await requirePermission('manageBilling')
  } catch {
    redirect('/login')
  }

  const { id } = await params
  const plan = await getPlan(id)

  if (!plan) {
    redirect('/admin/billing/plans')
  }

  return (
    <div className="space-y-6">
        <PageHeader
          title={plan.name}
          description="Plan details and current configuration for billing administrators."
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-end">
            <Link href={`/admin/billing/plans/${plan.id}/edit`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Edit plan
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{plan.slug}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{plan.name}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Pricing</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">₹{plan.price.toFixed(0)}</p>
              <p className="mt-2 text-sm text-slate-500">Interval: {plan.interval}</p>
              <p className="mt-2 text-sm text-slate-500">Display order: {plan.displayOrder}</p>
              <p className="mt-2 text-sm text-slate-500">Status: {plan.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-950">Enabled features</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.features.length > 0 ? plan.features.map((feature) => (
                <span key={feature} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
                  {feature}
                </span>
              )) : (
                <p className="text-sm text-slate-500">No features are enabled for this plan.</p>
              )}
            </div>
          </div>
        </section>
      </div>
  )
}
