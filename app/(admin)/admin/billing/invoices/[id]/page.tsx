import Link from 'next/link'
import { redirect } from 'next/navigation'import PageHeader from '@/components/admin/PageHeader'
import InvoiceAdminActions from '@/components/admin/billing/InvoiceAdminActions'
import { requirePermission } from '@/auth'
import { getInvoice } from '@/server/actions/billing.actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: Props) {
  try {
    await requirePermission('manageInvoices')
  } catch {
    redirect('/login')
  }

  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) {
    redirect('/admin/billing/invoices')
  }

  return (
    <div className="space-y-6">
        <PageHeader title={invoice.invoiceNumber} description="Review invoice metadata, subscription context, and lifecycle state." />

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Invoice</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{invoice.invoiceNumber}</h2>
            </div>
            <Link href="/admin/billing/invoices" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Back to invoices
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <InvoiceAdminActions invoiceId={invoice.id} />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Student</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{invoice.studentName}</p>
                <p className="mt-1 text-sm text-slate-600">{invoice.studentEmail}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Subscription / Plan</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{invoice.planName}</p>
                <p className="mt-1 text-sm text-slate-600">{invoice.subscriptionStatus}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Notes</p>
                <p className="mt-2 text-sm text-slate-600">{invoice.notes || 'No notes recorded.'}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{invoice.status}</p>
              <p className="mt-4 text-sm text-slate-500">Amount: {invoice.currency} {invoice.amount.toFixed(2)}</p>
              <p className="mt-2 text-sm text-slate-500">Tax: {invoice.currency} {invoice.taxAmount.toFixed(2)}</p>
              <p className="mt-2 text-sm text-slate-500">Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p className="mt-2 text-sm text-slate-500">Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</p>
              <p className="mt-2 text-sm text-slate-500">Paid: {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}</p>
            </div>
          </div>
        </section>
      </div>
  )
}
