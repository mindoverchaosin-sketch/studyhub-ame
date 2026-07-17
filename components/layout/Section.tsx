import type { ReactNode, HTMLAttributes } from "react";
import { Container } from "@/components/layout/Container";

type SectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: "section" | "div";
  padded?: boolean;
  background?: "default" | "muted" | "accent";
};

const backgroundClasses = {
  default: "bg-transparent",
  muted: "bg-slate-50/80",
  accent: "bg-gradient-to-b from-blue-50/70 to-white",
} as const;

export default function Section({ children, className = "", as: Component = "section", padded = true, background = "default", ...props }: SectionProps) {
  return (
    <Component className={[padded ? "py-16 sm:py-20 lg:py-24" : "", backgroundClasses[background], className].filter(Boolean).join(" ")} {...props}>
      <Container>{children}</Container>
    </Component>
  );
}
