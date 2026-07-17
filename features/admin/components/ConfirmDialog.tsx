"use client"

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-[1.5rem] bg-white p-8 shadow-2xl shadow-slate-950/10">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-4 text-sm text-slate-600">{description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
