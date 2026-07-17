import type { HTMLAttributes, ReactNode } from "react";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
};

export default function Section({ children, className = "", as: Component = "section", ...props }: SectionProps) {
  return (
    <Component className={["py-20 sm:py-24 lg:py-28", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}
