import type { ReactNode, HTMLAttributes } from "react";
import { borderRadius, colors, shadows, transitions } from "@/constants/theme";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered";
};

const variantClasses = {
  default: "border border-slate-200/80 bg-white",
  elevated: "border border-slate-200/80 bg-white",
  bordered: "border border-slate-200 bg-slate-50",
} as const;

export default function Card({ children, className = "", variant = "default", style, ...props }: CardProps) {
  const variantStyle =
    variant === "elevated"
      ? {
          borderRadius: borderRadius["2xl"],
          boxShadow: shadows.lg,
          transitionDuration: transitions.slow,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...style,
        }
      : {
          borderRadius: borderRadius["2xl"],
          transitionDuration: transitions.slow,
          backgroundColor: variant === "bordered" ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
          ...style,
        };

  return (
    <div className={["rounded-[1.5rem] p-6 sm:p-8 transition duration-300", variantClasses[variant], className].filter(Boolean).join(" ")} style={variantStyle} {...props}>
      {children}
    </div>
  );
}
