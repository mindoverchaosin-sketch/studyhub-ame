import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { borderRadius, colors, shadows, transitions } from "@/constants/theme";

type CTAButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function CTAButton({ href, children, variant = "primary", className = "", style, ...props }: CTAButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2";

  const classes = variant === "primary" ? `${baseClasses} text-white` : `${baseClasses} border border-slate-300 bg-white/85 text-slate-700 hover:border-slate-400 hover:bg-white`;

  return (
    <Link
      href={href}
      className={[classes, className].filter(Boolean).join(" ")}
      style={{
        borderRadius: borderRadius.full,
        backgroundColor: variant === "primary" ? colors.primary : undefined,
        boxShadow: variant === "primary" ? shadows.md : undefined,
        transitionDuration: transitions.slow,
        ...style,
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
