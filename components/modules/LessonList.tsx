import type { ModuleLesson } from "@/lib/mock/modules";

type LessonListProps = {
  lessons: ModuleLesson[];
};

export default function LessonList({ lessons }: LessonListProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <h2 className="text-xl font-semibold tracking-tight text-slate-950">Lesson list</h2>
      <div className="mt-5 space-y-3">
        {lessons.length > 0 ? (
          lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-950">{lesson.title}</p>
                <p className="mt-1 text-sm text-slate-600">{lesson.duration}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${lesson.completed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                {lesson.completed ? "Completed" : "Upcoming"}
              </span>
            </div>
          ))
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            Lessons will appear here once the module content is published.
          </div>
        )}
      </div>
    </section>
  );
}
