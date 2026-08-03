"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import React from "react";
import { borderRadius, colors, shadows, transitions } from "@/constants/theme";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  asChild?: boolean;
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
  asChild = false,
  type,
  onClick,
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

  // Ensure buttons inside forms do not implicitly submit unless explicitly requested
  const buttonType = type ?? "button";

  if (asChild) {
    // If the child is an interactive element (anchor, Link, or button), clone it and merge classes/handlers
    const child = React.Children.only(children) as React.ReactElement | null;

    if (React.isValidElement(child)) {
      const childProps: any = child.props || {};
      const isInteractive = !!(childProps.href || child.type === 'a' || child.type === 'button');

      const mergedClassName = [baseClasses, variantClasses[variant], sizeClasses[size], fullWidth ? "w-full" : "", className, childProps.className]
        .filter(Boolean)
        .join(" ");

      const mergedStyle = { ...(childProps.style || {}), ...variantStyle };

      const mergedOnClick = (e: any) => {
        onClick?.(e);
        childProps.onClick?.(e);
      };

      if (isInteractive) {
        return React.cloneElement(child, {
          className: mergedClassName,
          style: mergedStyle,
          onClick: mergedOnClick,
        } as any);
      }
    }

    // Fallback: non-interactive child, preserve previous span/button behavior
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(e as any);
          }
        }}
        className={[baseClasses, variantClasses[variant], sizeClasses[size], fullWidth ? "w-full" : "", className].filter(Boolean).join(" ")}
        style={variantStyle}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type={buttonType}
      onClick={onClick}
      className={[baseClasses, variantClasses[variant], sizeClasses[size], fullWidth ? "w-full" : "", className].filter(Boolean).join(" ")}
      style={variantStyle}
      {...props}
    >
      {children}
    </button>
  );
}
