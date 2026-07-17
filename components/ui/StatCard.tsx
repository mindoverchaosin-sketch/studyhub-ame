import type { HTMLAttributes, ReactNode } from "react";
import { borderRadius, colors, shadows } from "@/constants/theme";

type StatCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
};

export default function StatCard({ label, value, detail, icon, className = "", style, ...props }: StatCardProps) {
  return (
    <div
      className={["rounded-[1.5rem] border border-slate-200/80 bg-white p-6", className].filter(Boolean).join(" ")}
      style={{ borderRadius: borderRadius["2xl"], boxShadow: shadows.sm, backgroundColor: colors.surface, ...style }}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div> : null}
      </div>
      {detail ? <p className="mt-4 text-sm leading-7 text-slate-600">{detail}</p> : null}
    </div>
  );
}
