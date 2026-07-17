import Link from "next/link";
import type { ReactNode } from "react";

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  ariaLabel?: string;
};

export default function ActionLink({ href, children, variant = "primary", className = "", ariaLabel }: ActionLinkProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold transition duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

  const variantClasses =
    variant === "primary"
      ? "bg-blue-600 text-white shadow-[0_16px_40px_-12px_rgba(37,99,235,0.45)] hover:bg-blue-700"
      : "border border-slate-300 bg-white/85 text-slate-700 shadow-sm hover:border-slate-400 hover:bg-white";

  return (
    <Link href={href} className={`${baseClasses} ${variantClasses} ${className}`.trim()} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
