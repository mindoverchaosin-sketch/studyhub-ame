import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

type StudyPlanCardProps = {
  title: string;
  description: string;
  cta: string;
  href: string;
};

export default function StudyPlanCard({ title, description, cta, href }: StudyPlanCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Study plan</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-300">
        {cta}
        <FiArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
