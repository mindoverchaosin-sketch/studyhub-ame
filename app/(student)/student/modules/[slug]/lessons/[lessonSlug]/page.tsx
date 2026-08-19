import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudent } from "@/auth";
import { notFound } from "next/navigation";
import { FiChevronLeft, FiChevronRight, FiDownload, FiFileText, FiFlag, FiList, FiPlayCircle } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ModuleHeader from "@/components/modules/ModuleHeader";
import { mockModules } from "@/lib/mock/modules";
import { getModuleBySlug } from "@/server/services/module.service";
import { contentAccessService } from "@/server/services/content-access.service";

export default async function StudentLessonPage({ params }: { params: Promise<{ slug: string; lessonSlug: string }> }) {
  const session = await requireStudent();
  const { slug, lessonSlug } = await params;
  const persistedModule = await getModuleBySlug(slug);

  if (!persistedModule) {
    notFound();
  }

  const access = await contentAccessService.canAccessLesson(session.user.id, persistedModule.isPremium);
  if (!access.allowed) {
    redirect(`/student/dashboard/billing?reason=lesson-access&feature=${access.requiredFeature ?? "premiumModules"}`);
  }

  const moduleItem = mockModules.find((item) => item.slug === slug);

  if (!moduleItem) {
    notFound();
  }

  const lesson = moduleItem.lessons.find((item) => item.slug === lessonSlug);

  if (!lesson) {
    notFound();
  }

  const currentIndex = moduleItem.lessons.findIndex((item) => item.slug === lessonSlug);
  const previousLesson = currentIndex > 0 ? moduleItem.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < moduleItem.lessons.length - 1 ? moduleItem.lessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:flex-row">
        <aside className="w-full xl:max-w-sm">
          <Card className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Module outline</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{moduleItem.title}</h2>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Overall progress</span>
                <span className="font-semibold text-slate-950">{moduleItem.progress}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${moduleItem.progress}%` }} />
              </div>
            </div>
            <div className="space-y-3">
              {moduleItem.lessons.map((item) => (
                <Link key={item.id} href={`/student/modules/${moduleItem.slug}/lessons/${item.slug}`} className={`flex items-start justify-between gap-3 rounded-[1.2rem] border p-3 text-left transition ${item.slug === lessonSlug ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.duration}</p>
                  </div>
                  <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${item.completed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                    {item.completed ? "Done" : "Next"}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </aside>

        <main className="flex-1 space-y-6">
          <ModuleHeader title={lesson.title} description={lesson.summary ?? "Continue through this lesson to strengthen your understanding and confidence."} showBackLink={false} />

          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Link href="/student/modules" className="font-semibold text-blue-700">Modules</Link>
            <span>/</span>
            <Link href={`/student/modules/${moduleItem.slug}`} className="font-semibold text-blue-700">{moduleItem.title}</Link>
            <span>/</span>
            <span className="text-slate-500">{lesson.title}</span>
          </nav>

          <Card className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Lesson content</h2>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{lesson.title}</p>
                </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" type="button">
                  <span className="flex items-center gap-2"><FiFlag className="h-4 w-4" />Mark complete</span>
                </Button>
                <Button variant="primary" size="sm" type="button">
                  <span className="flex items-center gap-2"><FiDownload className="h-4 w-4" />Resources</span>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
                  <FiFileText className="h-4 w-4" />Reading content
                </div>
                <p className="mt-4 text-sm leading-8 text-slate-700">
                  This lesson page is intentionally structured as a reusable placeholder so the real instructional content can be dropped in later without changing the experience.
                </p>
                <p className="mt-4 text-sm leading-8 text-slate-700">
                  Use this template for theory, step-by-step guidance, diagrams, and exam-focused notes that students can revisit whenever they need a refresher.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
                  <FiPlayCircle className="h-4 w-4" />Key points
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {(lesson.keyPoints ?? ["Review core principles", "Connect theory to exam scenarios", "Summarize the key takeaway"]).map((point) => (
                    <li key={point} className="rounded-[1rem] border border-slate-200 bg-white p-3">{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
                <FiList className="h-4 w-4" />Notes
              </div>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {(lesson.notes ?? ["Capture your own summary after studying the lesson.", "Add any follow-up questions for later review."]).map((note) => (
                  <li key={note} className="rounded-[1rem] border border-slate-200 bg-white p-3">{note}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
              {previousLesson ? (
                <Link href={`/student/modules/${moduleItem.slug}/lessons/${previousLesson.slug}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300">
                  <FiChevronLeft className="h-4 w-4" />Previous lesson
                </Link>
              ) : <span />}
              {nextLesson ? (
                <Link href={`/student/modules/${moduleItem.slug}/lessons/${nextLesson.slug}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Next lesson<FiChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href={`/student/modules/${moduleItem.slug}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Finish module<FiChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
