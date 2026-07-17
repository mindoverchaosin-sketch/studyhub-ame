import Link from "next/link";
import { FiArrowRight, FiCheckCircle, FiCircle, FiClock } from "react-icons/fi";
import type { CourseBrowserModule } from "@/features/courses/types";

type ModuleCardProps = {
  courseSlug: string;
  module: CourseBrowserModule;
};

export default function ModuleCard({ courseSlug, module }: ModuleCardProps) {
  const statusLabel = module.status === "COMPLETED" ? "Completed" : module.status === "IN_PROGRESS" ? "In progress" : "Not started";
  const StatusIcon = module.status === "COMPLETED" ? FiCheckCircle : module.status === "IN_PROGRESS" ? FiClock : FiCircle;

  return (
    <article className="rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{module.description || "A structured module with clear sections and revision topics."}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
          <StatusIcon className="h-4 w-4" />
          {statusLabel}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span>{module.sectionCount} sections</span>
        <span>{module.topicCount} topics</span>
        <span>{module.completedTopics}/{module.topicCount} completed</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${module.progressPercent}%` }} />
      </div>

      <div className="mt-5">
        <Link href={`/student/courses/${courseSlug}/modules/${module.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700">
          Open module
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
