import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudent } from "@/auth";
import { notFound } from "next/navigation";
import { FiChevronLeft, FiChevronRight, FiDownload, FiExternalLink, FiFileText, FiFlag, FiList, FiLock, FiPlayCircle } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ModuleHeader from "@/components/modules/ModuleHeader";
import { getModuleBySlug } from "@/server/services/module.service";
import { contentAccessService } from "@/server/services/content-access.service";
import { getTopicBySlug } from "@/server/services/topic.service";
import { getTopicLearningPageData } from "@/features/topics/actions/topic-learning";

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

  const topic = await getTopicBySlug(lessonSlug);
  if (!topic || topic.moduleId !== persistedModule.id) {
    notFound();
  }
  const data = await getTopicLearningPageData(lessonSlug);
  if (!data) notFound();
  const resourceAccess = await Promise.all(data.resources.map((resource) => contentAccessService.canAccessStudyMaterial(session.user.id, resource.isPremium)));

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 xl:flex-row">
        <aside className="w-full xl:max-w-sm">
          <Card className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Module outline</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{persistedModule.title}</h2>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Overall progress</span>
                <span className="font-semibold text-slate-950">{data.progress.completed ? "100" : "0"}%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: data.progress.completed ? "100%" : "0%" }} />
              </div>
            </div>
            <p className="text-sm text-slate-600">{persistedModule.isPremium ? "Premium module" : "Free module"} · {data.progress.status}</p>
          </Card>
        </aside>

        <main className="flex-1 space-y-6">
          <ModuleHeader title={data.topic.title} description={data.topic.description ?? "Continue through this persisted lesson."} showBackLink={false} />

          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Link href="/student/modules" className="font-semibold text-blue-700">Modules</Link>
            <span>/</span>
            <Link href={`/student/modules/${persistedModule.slug}`} className="font-semibold text-blue-700">{persistedModule.title}</Link>
            <span>/</span>
            <span className="text-slate-500">{data.topic.title}</span>
          </nav>

          <Card className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Lesson content</h2>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{data.topic.title}</p>
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
                <p className="mt-4 text-sm leading-8 text-slate-700">{data.topic.description ?? "This lesson is ready for study and revision."}</p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
                  <FiPlayCircle className="h-4 w-4" />Key points
                </div>
                {data.questions.length > 0 ? <ul className="mt-4 space-y-3 text-sm text-slate-700">{data.questions.slice(0, 3).map((question) => <li key={question.id} className="rounded-[1rem] border border-slate-200 bg-white p-3">{question.question}</li>)}</ul> : <p className="mt-4 text-sm text-slate-600">No published practice questions yet.</p>}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
                <FiList className="h-4 w-4" />Notes
              </div>
              {data.resources.length > 0 ? <ul className="mt-4 space-y-3 text-sm text-slate-700">{data.resources.map((resource, index) => {
                const resourceUrl = `/api/student/resources/${resource.id}?lessonId=${encodeURIComponent(data.topic.id)}&moduleId=${encodeURIComponent(persistedModule.id)}`;
                const isLocked = !resourceAccess[index].allowed;
                return <li key={resource.id} className="flex flex-col gap-3 rounded-[1rem] border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950">{resource.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{resource.type}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${resource.isPremium ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{resource.isPremium ? "Premium" : "Free"}</span>
                    </div>
                  </div>
                  {isLocked ? <Link href={`/student/dashboard/billing?reason=resource-access&feature=premiumModules`} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-amber-700"><FiLock className="h-4 w-4" />Upgrade</Link> : <Link href={resourceUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-700"><FiExternalLink className="h-4 w-4" />Open</Link>}
                </li>
              })}</ul> : <p className="mt-4 text-sm text-slate-600">No published resources yet.</p>}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
              <Link href={`/student/modules/${persistedModule.slug}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">Back to module<FiChevronRight className="h-4 w-4" /></Link>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
