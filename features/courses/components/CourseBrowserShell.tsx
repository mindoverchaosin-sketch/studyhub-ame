import type { ReactNode } from "react";

type CourseBrowserShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function CourseBrowserShell({ title, description, children }: CourseBrowserShellProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.04)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Student learning</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{description}</p>
      </div>
      {children}
    </div>
  );
}
