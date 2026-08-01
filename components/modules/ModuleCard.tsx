import Link from "next/link";
import { FiBookOpen, FiFileText, FiPlayCircle } from "react-icons/fi";
import type { Module } from "@/types/module";

type ModuleCardProps = {
  moduleItem: Module;
};

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  NOT_STARTED: "bg-slate-100 text-slate-700",
  LOCKED: "bg-amber-50 text-amber-700",
};

export default function ModuleCard({ moduleItem }: ModuleCardProps) {
  const actionLabel = moduleItem.status === "COMPLETED" ? "Review" : moduleItem.status === "LOCKED" ? "Locked" : "Continue";

  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Module {moduleItem.number}</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{moduleItem.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles[moduleItem.status]}`}>
          {moduleItem.status.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">{moduleItem.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
          {moduleItem.difficulty}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
          {moduleItem.estimatedHours}h
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FiBookOpen className="h-4 w-4" />
            {moduleItem.progress}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Progress</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FiPlayCircle className="h-4 w-4" />
            {moduleItem.lessonsCount}
          </div>
          <p className="mt-1 text-xs text-slate-500">Lessons</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FiFileText className="h-4 w-4" />
            {moduleItem.resourcesCount}
          </div>
          <p className="mt-1 text-xs text-slate-500">Resources</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{moduleItem.lastStudied}</p>
        {moduleItem.status === "LOCKED" ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
            Locked
          </span>
        ) : (
          <Link href={`/student/modules/${moduleItem.slug}`} className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            {actionLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
