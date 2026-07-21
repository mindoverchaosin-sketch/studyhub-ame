import type { Module } from "@/types/module";

type ModuleProgressProps = {
  moduleItem: Module;
};

export default function ModuleProgress({ moduleItem }: ModuleProgressProps) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Progress summary</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{moduleItem.progress}% complete</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{moduleItem.status}</span>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${moduleItem.progress}%` }} />
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">{moduleItem.summary}</p>
    </div>
  );
}
