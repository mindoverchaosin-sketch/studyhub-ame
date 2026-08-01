export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
      {label}
    </div>
  );
}
