import type { ReactNode, HTMLAttributes } from "react";

type GridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
};

const colsClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
} as const;

const gapClasses = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
} as const;

export default function Grid({ children, cols = 3, gap = "md", className = "", ...props }: GridProps) {
  return (
    <div className={["grid", colsClasses[cols], gapClasses[gap], className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
