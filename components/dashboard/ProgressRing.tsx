import type { ReactNode } from "react";

type ProgressRingProps = {
  value: number;
  label: string;
  caption: string;
  tone?: "blue" | "cyan" | "emerald" | "violet";
  action?: ReactNode;
};

export default function ProgressRing({ value, label, caption, tone = "blue", action }: ProgressRingProps) {
  const accentMap = {
    blue: "from-blue-600 to-cyan-500",
    cyan: "from-cyan-500 to-sky-500",
    emerald: "from-emerald-500 to-lime-500",
    violet: "from-violet-500 to-indigo-500",
  } as const;

  return (
    <div className="flex flex-col gap-5 rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.24)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{caption}</p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${accentMap[tone]} text-sm font-semibold text-white`}>
          {value}%
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${accentMap[tone]}`} style={{ width: `${Math.max(6, Math.min(100, value))}%` }} />
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}
