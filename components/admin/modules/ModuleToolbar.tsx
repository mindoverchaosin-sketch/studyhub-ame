import type { ReactNode } from "react";

interface ModuleToolbarProps {
  children: ReactNode;
  title: string;
}

export default function ModuleToolbar({ children, title }: ModuleToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Admin CMS</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
