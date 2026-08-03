import { Modal } from './Modal';
import React from 'react';

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onCancel, onConfirm }: { open: boolean; title: string; message: string; confirmLabel?: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;

  return (
    <Modal open={open} title={title} description={message} onClose={onCancel}>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
        <button type="button" onClick={onConfirm} autoFocus className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white">{confirmLabel}</button>
      </div>
    </Modal>
  );
}
