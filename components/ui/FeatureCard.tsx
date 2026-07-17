import type { HTMLAttributes, ReactNode } from "react";
import { borderRadius, colors, shadows, transitions } from "@/constants/theme";

type FeatureCardProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  icon?: ReactNode;
};

export default function FeatureCard({ title, description, icon, className = "", style, ...props }: FeatureCardProps) {
  return (
    <div
      className={["rounded-[1.5rem] border border-slate-200/80 p-8 transition duration-300 hover:-translate-y-1", className].filter(Boolean).join(" ")}
      style={{
        borderRadius: borderRadius["2xl"],
        boxShadow: shadows.md,
        background: `linear-gradient(135deg, ${colors.surface} 0%, #f8fafc 100%)`,
        transitionDuration: transitions.slow,
        ...style,
      }}
      {...props}
    >
      {icon ? <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div> : null}
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.01em] text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}
