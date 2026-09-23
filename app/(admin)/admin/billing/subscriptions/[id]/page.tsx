import Link from 'next/link'
import { redirect } from 'next/navigation'import PageHeader from '@/components/admin/PageHeader'
import SubscriptionAdminActions from '@/components/admin/billing/SubscriptionAdminActions'
import { requirePermission } from '@/auth'
import { getSubscription } from '@/server/actions/billing.actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SubscriptionDetailPage({ params }: Props) {
  try {
    await requirePermission('manageBilling')
  } catch {
    redirect('/login')
  }

  const { id } = await params
  const subscription = await getSubscription(id)

  if (!subscription) {
    redirect('/admin/billing/subscriptions')
  }

  return (
    <div className="space-y-6">
        <PageHeader title="Subscription details" description="Inspect plan state, lifecycle dates, and entitlements for a student subscription." />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Subscription</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{subscription.studentName}</h2>
            </div>
            <Link href="/admin/billing/subscriptions" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Back to list
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <SubscriptionAdminActions subscriptionId={subscription.id} currentPlanId={subscription.planId} plans={[{ id: subscription.planId, name: subscription.planName }]} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Current plan</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{subscription.planName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Student</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{subscription.studentEmail}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{subscription.status}</p>
              <p className="mt-4 text-sm text-slate-500">Start date: {new Date(subscription.currentPeriodStart).toLocaleDateString()}</p>
              <p className="mt-2 text-sm text-slate-500">Renewal date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
              <p className="mt-2 text-sm text-slate-500">Expiry date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
          </div>
        </section>
      </div>
  )
}
