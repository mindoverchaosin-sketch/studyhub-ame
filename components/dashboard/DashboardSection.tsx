import type { ReactNode } from "react";
import Heading from "@/components/ui/Heading";

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function DashboardSection({ title, description, children }: DashboardSectionProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Heading as="h2" size="sm" className="text-xl">
            {title}
          </Heading>
          {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
