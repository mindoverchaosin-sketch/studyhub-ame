import type { ReactNode } from "react";

type TopicSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function TopicSectionCard({ title, description, children }: TopicSectionCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
