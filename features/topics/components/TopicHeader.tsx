import Link from "next/link";

type TopicHeaderProps = {
  title: string;
  breadcrumb: { courseTitle: string; courseSlug: string; moduleTitle: string; moduleSlug: string };
  estimatedMinutes: number | null;
  difficulty: string;
};

export default function TopicHeader({ title, breadcrumb, estimatedMinutes, difficulty }: TopicHeaderProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.04)] sm:p-8">
      <div className="flex flex-col gap-3">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
          <Link href={`/student/courses/${breadcrumb.courseSlug}`} className="hover:text-blue-700">
            {breadcrumb.courseTitle}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/student/courses/${breadcrumb.courseSlug}/modules/${breadcrumb.moduleSlug}`} className="hover:text-blue-700">
            {breadcrumb.moduleTitle}
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
          {estimatedMinutes ?? 0} min study time
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
          Difficulty: {difficulty}
        </span>
      </div>
    </section>
  );
}
