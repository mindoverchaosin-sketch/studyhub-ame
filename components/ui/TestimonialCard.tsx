import type { HTMLAttributes, ReactNode } from "react";
import { borderRadius, colors, shadows, transitions } from "@/constants/theme";

type TestimonialCardProps = HTMLAttributes<HTMLElement> & {
  quote: string;
  author: string;
  role: string;
  avatar?: ReactNode;
};

export default function TestimonialCard({ quote, author, role, avatar, className = "", style, ...props }: TestimonialCardProps) {
  return (
    <figure
      className={["rounded-[1.5rem] border border-slate-200/80 p-8 transition duration-300 hover:-translate-y-1", className].filter(Boolean).join(" ")}
      style={{ borderRadius: borderRadius["2xl"], boxShadow: shadows.md, background: `linear-gradient(135deg, #f8fafc 0%, ${colors.surface} 100%)`, transitionDuration: transitions.slow, ...style }}
      {...props}
    >
      <blockquote className="text-base leading-8 text-slate-700">“{quote}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-4">
        {avatar}
        <div>
          <p className="font-semibold text-slate-950">{author}</p>
          <p className="mt-1 text-sm text-slate-600">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}
