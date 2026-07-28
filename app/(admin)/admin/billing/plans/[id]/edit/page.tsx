import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import PageHeader from '@/components/admin/PageHeader'
import { requirePermission } from '@/auth'
import { getPlan, savePlanChanges } from '@/server/actions/billing.actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBillingPlanPage({ params }: Props) {
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
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title={`Edit ${plan.name}`}
          description="Update plan pricing, order, visibility, and feature list."
        />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <form action={savePlanChanges.bind(null, id)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Name</span>
                <input defaultValue={plan.name} name="name" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Interval</span>
                <select defaultValue={plan.interval} name="interval" className="w-full rounded-2xl border border-slate-300 px-4 py-3">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Description</span>
              <textarea defaultValue={plan.description ?? ''} name="description" rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>

            <div className="grid gap-6 md:grid-cols-3">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Price</span>
                <input defaultValue={plan.price} type="number" min="0" name="price" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Display order</span>
                <input defaultValue={plan.displayOrder} type="number" min="0" name="displayOrder" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input defaultChecked={plan.isActive} type="checkbox" name="isActive" className="h-4 w-4" />
                <span>Active</span>
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Features (comma separated)</span>
              <input defaultValue={plan.features.join(', ')} name="features" className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
            </label>

            <div className="flex justify-end gap-3">
              <a href={`/admin/billing/plans/${id}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </a>
              <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Save changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  )
}
