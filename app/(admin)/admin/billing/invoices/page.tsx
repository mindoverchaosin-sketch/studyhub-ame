import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import PageHeader from '@/components/admin/PageHeader'
import { requirePermission } from '@/auth'
import { getInvoices } from '@/server/actions/billing.actions'

export default async function InvoiceDirectoryPage() {
  try {
    await requirePermission('manageInvoices')
  } catch {
    redirect('/login')
  }

  const invoices = await getInvoices({ page: 1, pageSize: 20 })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Invoice management" description="Track invoice lifecycle states, due dates, and payment status for subscriptions." />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3">Invoice</th>
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{invoice.invoiceNumber}</div>
                      <div className="text-slate-500">{new Date(invoice.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{invoice.studentName}</div>
                      <div className="text-slate-500">{invoice.studentEmail}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{invoice.planName}</td>
                    <td className="px-3 py-3 text-slate-700">{invoice.currency} {invoice.amount.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : invoice.status === 'CANCELLED' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
