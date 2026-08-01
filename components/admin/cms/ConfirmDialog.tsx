export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onCancel, onConfirm }: { open: boolean; title: string; message: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
