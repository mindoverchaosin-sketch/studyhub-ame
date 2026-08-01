export function StatusBadge({ status }: { status: string }) {
  const palette = {
    Draft: 'bg-amber-100 text-amber-700',
    Published: 'bg-emerald-100 text-emerald-700',
    Archived: 'bg-slate-100 text-slate-700',
    Disabled: 'bg-rose-100 text-rose-700',
  } as Record<string, string>;

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${palette[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
