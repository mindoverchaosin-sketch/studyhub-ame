import Link from "next/link";
import { FiArrowRight, FiBookOpen } from "react-icons/fi";
import type { CourseBrowserCourse } from "@/features/courses/types";

type CourseCardProps = {
  course: CourseBrowserCourse;
};

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{course.examType}</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{course.title}</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <FiBookOpen className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">{course.description || "A structured study path designed for deep revision and exam readiness."}</p>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
        <span>{course.moduleCount} modules</span>
        <span>{course.progressPercent}% complete</span>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${course.progressPercent}%` }} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-slate-500">{course.completedTopics}/{course.totalTopics} topics completed</span>
        <Link href={`/student/courses/${course.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700">
          Continue
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
