import type { ButtonHTMLAttributes, ReactNode } from "react";
import { borderRadius, colors, shadows, transitions } from "@/constants/theme";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-full border font-semibold tracking-[0.01em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses = {
  primary: "border-transparent text-white hover:-translate-y-0.5",
  secondary: "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50",
  ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100",
} as const;

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm",
} as const;

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const variantStyle =
    variant === "primary"
      ? {
          backgroundColor: colors.primary,
          boxShadow: shadows.md,
          borderRadius: borderRadius.full,
          transitionDuration: transitions.slow,
          ...style,
        }
      : variant === "secondary"
        ? {
            borderRadius: borderRadius.full,
            transitionDuration: transitions.slow,
            ...style,
          }
        : {
            borderRadius: borderRadius.full,
            transitionDuration: transitions.slow,
            ...style,
          };

  return (
    <button
      className={[baseClasses, variantClasses[variant], sizeClasses[size], fullWidth ? "w-full" : "", className].filter(Boolean).join(" ")}
      style={variantStyle}
      {...props}
    >
      {children}
    </button>
  );
}
