interface ModuleActionsProps {
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onPublish: () => void;
}

export default function ModuleActions({ onView, onEdit, onDuplicate, onArchive, onDelete, onPublish }: ModuleActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={onView} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">View</button>
      <button onClick={onEdit} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">Edit</button>
      <button onClick={onDuplicate} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">Duplicate</button>
      <button onClick={onArchive} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">Archive</button>
      <button onClick={onPublish} className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">Publish</button>
      <button onClick={onDelete} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">Delete</button>
    </div>
  );
}
