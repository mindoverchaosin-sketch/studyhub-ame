'use client'

import { useState, useTransition } from 'react'
import { cancelInvoice, markPaid, voidInvoice } from '@/server/actions/billing.actions'

interface Props {
  invoiceId: string
}

export default function InvoiceAdminActions({ invoiceId }: Props) {
  const [isPending, startTransition] = useTransition()

  const perform = async (action: () => Promise<unknown>, label: string) => {
    if (!window.confirm(`Confirm ${label} for this invoice?`)) {
      return
    }

    startTransition(async () => {
      await action()
    })
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">Invoice actions</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => perform(() => markPaid(invoiceId), 'mark paid')}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Mark paid
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => perform(() => cancelInvoice(invoiceId), 'cancel invoice')}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => perform(() => voidInvoice(invoiceId), 'void invoice')}
          className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Void
        </button>
      </div>
      <p className="text-xs text-slate-500">Mark paid is a placeholder action and does not process payment.</p>
    </div>
  )
}
