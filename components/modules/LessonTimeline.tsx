import Link from "next/link";
import { FiCheckCircle, FiLock, FiPlayCircle } from "react-icons/fi";
import type { ModuleLesson } from "@/lib/mock/modules";

type LessonTimelineProps = {
  lessons: ModuleLesson[];
  moduleSlug: string;
};

export default function LessonTimeline({ lessons, moduleSlug }: LessonTimelineProps) {
  return (
    <section id="lessons" className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Lesson list</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Study path</h2>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {lessons.length > 0 ? lessons.map((lesson) => (
          <div key={lesson.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-1 flex h-9 w-9 items-center justify-center rounded-2xl ${lesson.completed ? "bg-emerald-50 text-emerald-600" : lesson.locked ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                  {lesson.locked ? <FiLock className="h-4 w-4" /> : lesson.completed ? <FiCheckCircle className="h-4 w-4" /> : <FiPlayCircle className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{lesson.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{lesson.duration}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{lesson.summary ?? "Build confidence with this guided lesson."}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${lesson.completed ? "bg-emerald-50 text-emerald-700" : lesson.locked ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>
                  {lesson.locked ? "Locked" : lesson.completed ? "Completed" : "Resume"}
                </span>
                {!lesson.locked ? (
                  <Link href={`/student/modules/${moduleSlug}/lessons/${lesson.slug}`} className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    {lesson.completed ? "Review" : "Start"}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            Lessons will appear here once content has been published.
          </div>
        )}
      </div>
    </section>
  );
}
