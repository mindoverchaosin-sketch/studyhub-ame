import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

type WelcomeBannerProps = {
  studentName: string;
  targetExam: string;
};

export default function WelcomeBanner({ studentName, targetExam }: WelcomeBannerProps) {
  const examLabel = targetExam === "BOTH" ? "DGCA & EASA" : targetExam;

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.04)] sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {studentName}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Your current target exam is <span className="font-semibold text-slate-900">{examLabel}</span>.
            Keep your momentum strong with a focused plan for today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            {examLabel} prep
          </div>
          <Link
            href="/modules"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            View modules
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
