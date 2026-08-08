import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireStudent } from '@/auth'
import Sidebar from '@/components/dashboard/Sidebar'
import { cancelStudentSubscription, createCheckoutSession, getStudentBillingOverviewAction } from '@/server/actions/billing.actions'
import type { InvoiceDTO, PlanDTO } from '@/server/domains/billing/dto/billing.dto'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value?: Date | null) {
  if (!value) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(value)
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700',
    SENT: 'bg-sky-100 text-sky-700',
    DRAFT: 'bg-slate-100 text-slate-700',
    FAILED: 'bg-rose-100 text-rose-700',
    CANCELLED: 'bg-amber-100 text-amber-700',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  )
}

interface StudentBillingPageProps {
  searchParams?: { interval?: string | string[]; checkout?: string | string[]; cancel?: string | string[] }
}

export default async function StudentBillingPage({ searchParams }: StudentBillingPageProps) {
  let sessionUser

  try {
    sessionUser = await requireStudent()
  } catch {
    redirect('/login')
  }

  const billing = await getStudentBillingOverviewAction(sessionUser.user.id as string)
  const intervalFilter = Array.isArray(searchParams?.interval) ? searchParams.interval[0] : searchParams?.interval
  const checkoutParam = Array.isArray(searchParams?.checkout) ? searchParams.checkout[0] : searchParams?.checkout
  const filteredPlans = billing.availablePlans.filter((plan) => {
    if (!intervalFilter || intervalFilter === 'all') {
      return true
    }
    return plan.interval === intervalFilter
  })

  const cancelParam = Array.isArray(searchParams?.cancel) ? searchParams.cancel[0] : searchParams?.cancel

  const checkoutMessage =
    checkoutParam === 'success'
      ? { title: 'Payment started', description: 'Your checkout is complete and we are confirming payment. Check this page shortly for billing updates.' }
      : checkoutParam === 'cancel'
      ? { title: 'Payment cancelled', description: 'Your checkout was cancelled. Select a plan again when you are ready to continue.' }
      : cancelParam === 'success'
      ? { title: 'Subscription cancelled', description: 'Your subscription has been cancelled. You can still access premium content until the end of the current billing period.' }
      : null

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />

        <main>
          {checkoutMessage ? (
            <div className="mb-4 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 text-slate-900 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{checkoutMessage.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{checkoutMessage.description}</p>
            </div>
          ) : null}
          <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Billing</h1>
            <p className="mt-2 text-sm text-slate-600">Review your current subscription, active entitlements, and billing invoices.</p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Subscription summary</h2>
                  <p className="mt-2 text-sm text-slate-600">Your subscription status, renewal details, and plan name.</p>
                </div>
                {billing.currentSubscription ? (
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Active</span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">No subscription</span>
                )}
              </div>

              {billing.currentSubscription ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-500">Plan</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{billing.currentSubscription.planName}</p>
                    <p className="mt-2 text-sm text-slate-600">{billing.currentSubscription.planSlug} plan</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-500">Renewal date</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{formatDate(billing.currentSubscription.renewalDate)}</p>
                    <p className="mt-2 text-sm text-slate-600">{formatCurrency(billing.currentSubscription.renewalAmount, billing.currentSubscription.currency)} due on renewal</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-500">Billing period</p>
                    <p className="mt-3 text-slate-950">{formatDate(billing.currentSubscription.currentPeriodStart)} —</p>
                    <p className="text-slate-950">{formatDate(billing.currentSubscription.currentPeriodEnd)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold text-slate-500">Status</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{billing.currentSubscription.status}</p>
                    {billing.currentSubscription.status !== 'ACTIVE' ? (
                      <p className="mt-2 text-sm text-slate-600">Your plan is not currently active.</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
                  <p className="text-base font-semibold">No active subscription found.</p>
                  <p className="mt-3 text-sm text-slate-600">Choose a plan from the available options below to start using premium learning tools.</p>
                  <Link href="/student/dashboard/billing#available-plans" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                    View plans
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Active entitlements</h2>
                <p className="mt-2 text-sm text-slate-600">Features available with your current subscription.</p>
              </div>

              <div className="mt-6 space-y-4">
                {billing.entitlements.features.length > 0 ? (
                  <div className="grid gap-3">
                    {billing.entitlements.features.map((feature) => (
                      <div key={feature} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        {feature}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    {billing.currentSubscription?.status === 'ACTIVE'
                      ? 'Your subscription does not currently include premium entitlements.'
                      : 'Subscribe to a plan to unlock additional features and premium access.'}
                  </div>
                )}

                {billing.entitlements.expiresAt ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Your subscription expires on {formatDate(billing.entitlements.expiresAt)}.
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Invoices</h2>
                <p className="mt-2 text-sm text-slate-600">Recent billing history for your subscription.</p>
              </div>
            </div>

            {billing.invoices.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-4 font-medium">Invoice</th>
                      <th className="px-4 py-4 font-medium">Amount</th>
                      <th className="px-4 py-4 font-medium">Due date</th>
                      <th className="px-4 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {billing.invoices.map((invoice: InvoiceDTO) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-4 text-slate-900">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-4 text-slate-900">{formatCurrency(invoice.amount, invoice.currency)}</td>
                        <td className="px-4 py-4 text-slate-900">{formatDate(invoice.dueDate)}</td>
                        <td className="px-4 py-4"> <InvoiceStatusBadge status={invoice.status} /> </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
                No invoices are available for your current billing account.
              </div>
            )}
          </section>

          <section id="available-plans" className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Available plans</h2>
                <p className="mt-2 text-sm text-slate-600">Choose a plan that matches your study goals and billing interval.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {['all', 'monthly', 'yearly'].map((interval) => (
                  <Link
                    key={interval}
                    href={`/student/dashboard/billing${interval === 'all' ? '' : `?interval=${interval}`}`}
                    className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold transition ${intervalFilter === interval ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    {interval === 'all' ? 'All billing' : interval === 'monthly' ? 'Monthly' : 'Annual'}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredPlans.map((plan: PlanDTO) => {
                const isCurrentPlan = billing.currentSubscription?.planId === plan.id
                const isFreePlan = plan.price === 0

                return (
                  <div key={plan.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{plan.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{plan.interval}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-slate-950">{formatCurrency(plan.price, plan.currency)}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-600">{plan.description}</p>

                    {plan.features.length > 0 ? (
                      <div className="mt-5 space-y-2">
                        {plan.features.map((feature) => (
                          <div key={feature} className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">{feature}</div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-6">
                      {isCurrentPlan ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Current plan</span>
                      ) : isFreePlan ? (
                        <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Free tier</span>
                      ) : (
                        <form action={createCheckoutSession} className="mt-2">
                          <input type="hidden" name="planId" value={plan.id} />
                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            {billing.currentSubscription ? 'Switch to this plan' : 'Subscribe'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
