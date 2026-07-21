interface ModuleDeleteDialogProps {
  moduleName: string;
  lessonsCount: number;
  materialsCount: number;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ModuleDeleteDialog({ moduleName, lessonsCount, materialsCount, open, onCancel, onConfirm }: ModuleDeleteDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-500">Danger</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">Delete {moduleName}?</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This will permanently remove the module and its linked content. It contains {lessonsCount} lessons and {materialsCount} study materials.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
          <button onClick={onConfirm} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete module</button>
        </div>
      </div>
    </div>
  );
}
