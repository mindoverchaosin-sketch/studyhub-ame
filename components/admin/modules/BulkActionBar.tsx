interface BulkActionBarProps {
  selectedCount: number;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function BulkActionBar({ selectedCount, onPublish, onArchive, onDelete }: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-950 px-4 py-3 text-sm text-white">
      <span>{selectedCount} selected</span>
      <button onClick={onPublish} className="rounded-full bg-emerald-600 px-3 py-1.5 font-semibold">Publish</button>
      <button onClick={onArchive} className="rounded-full bg-slate-700 px-3 py-1.5 font-semibold">Archive</button>
      <button onClick={onDelete} className="rounded-full bg-rose-600 px-3 py-1.5 font-semibold">Delete</button>
    </div>
  );
}
