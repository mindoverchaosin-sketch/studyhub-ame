import type { ReactNode, HTMLAttributes } from "react";
import { borderRadius, colors } from "@/constants/theme";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: "default" | "soft" | "accent";
};

const variantClasses = {
  default: "text-white",
  soft: "text-slate-700",
  accent: "text-blue-700",
} as const;

export default function Badge({ children, variant = "default", className = "", style, ...props }: BadgeProps) {
  const variantStyle = {
    borderRadius: borderRadius.full,
    padding: "0.35rem 0.7rem",
    backgroundColor: variant === "accent" ? "rgba(37, 99, 235, 0.1)" : variant === "soft" ? "#f1f5f9" : colors.text,
    color: variant === "accent" ? colors.primary : variant === "soft" ? colors.textMuted : colors.surface,
    ...style,
  };

  return (
    <span className={["inline-flex items-center text-sm font-medium", variantClasses[variant], className].filter(Boolean).join(" ")} style={variantStyle} {...props}>
      {children}
    </span>
  );
}
