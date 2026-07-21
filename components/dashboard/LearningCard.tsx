import Link from "next/link";
import { FiClock, FiCalendar, FiArrowRight } from "react-icons/fi";
import ProgressBar from "@/components/dashboard/ProgressBar";
import type { ContinueLearningItem } from "@/lib/mock/dashboard";

type LearningCardProps = ContinueLearningItem;

export default function LearningCard({ module, lesson, progress }: LearningCardProps) {
  const { title: moduleTitle } = module;
  const { title: lessonTitle, description, href } = lesson;
  const { progress: percent, remainingTime, lastStudied } = progress;
  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{moduleTitle}</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{lessonTitle}</h3>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {percent}% complete
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>

      <div className="mt-5">
        <ProgressBar progress={percent} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <FiClock className="h-4 w-4" />
          {remainingTime}
        </span>
        <span className="inline-flex items-center gap-2">
          <FiCalendar className="h-4 w-4" />
          {lastStudied}
        </span>
      </div>

      <div className="mt-6">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Resume Learning
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
