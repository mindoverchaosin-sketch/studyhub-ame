import type { HTMLAttributes, ReactNode } from "react";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "text-2xl sm:text-3xl",
  md: "text-3xl sm:text-4xl",
  lg: "text-4xl sm:text-5xl",
  xl: "text-5xl sm:text-6xl",
} as const;

export default function Heading({ children, as: Component = "h2", size = "md", className = "", ...props }: HeadingProps) {
  return (
    <Component className={["font-semibold tracking-[-0.025em] text-slate-950", sizeClasses[size], className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}
