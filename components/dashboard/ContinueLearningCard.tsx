import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

type ContinueLearningCardProps = {
  topicTitle: string;
  progressPercent: number;
  href: string;
};

export default function ContinueLearningCard({ topicTitle, progressPercent, href }: ContinueLearningCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Continue learning</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{topicTitle}</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
          {progressPercent}%
        </span>
      </div>

      <div className="mt-5 h-2.5 rounded-full bg-slate-100">
        <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${Math.max(6, progressPercent)}%` }} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Continue
          <FiArrowRight className="h-4 w-4" />
        </Link>
        <span className="text-sm text-slate-500">Resume from your latest study session</span>
      </div>
    </section>
  );
}
