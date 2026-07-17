import type { HTMLAttributes, ReactNode } from "react";
import { borderRadius, colors, shadows, transitions } from "@/constants/theme";

type ModuleCardProps = HTMLAttributes<HTMLElement> & {
  title: string;
  description: string;
  meta: ReactNode;
  icon?: ReactNode;
};

export default function ModuleCard({ title, description, meta, icon, className = "", style, ...props }: ModuleCardProps) {
  return (
    <article
      className={["group rounded-[1.5rem] border border-slate-200/80 bg-white p-7 transition duration-300 hover:-translate-y-1", className].filter(Boolean).join(" ")}
      style={{ borderRadius: borderRadius["2xl"], boxShadow: shadows.md, backgroundColor: colors.surface, transitionDuration: transitions.slow, ...style }}
      {...props}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-600">
        {icon ?? title.charAt(0)}
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.01em] text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-6 text-sm font-medium text-slate-700">{meta}</div>
    </article>
  );
}
