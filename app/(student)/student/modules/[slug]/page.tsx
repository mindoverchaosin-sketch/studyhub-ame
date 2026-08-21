import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/auth";
import { FiBookOpen, FiChevronRight, FiFileText, FiLock } from "react-icons/fi";
import Card from "@/components/ui/Card";
import ModuleHeader from "@/components/modules/ModuleHeader";
import EmptyState from "@/components/dashboard/EmptyState";
import { getModuleBySlug, getModuleWithSections } from "@/server/services/module.service";
import { getCourseById } from "@/server/services/course.service";
import { getStudentProgress } from "@/server/services/progress.service";
import { getResourcesByTopic } from "@/server/services/resource.service";
import { getQuizByTopic } from "@/server/services/quiz.service";
import { contentAccessService } from "@/server/services/content-access.service";

export default async function StudentModuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await requireStudent();
  const { slug } = await params;
  const moduleItem = await getModuleBySlug(slug);

  if (!moduleItem) {
    notFound();
  }

  const access = await contentAccessService.canAccessModule(session.user.id, moduleItem.isPremium);
  if (!access.allowed) {
    redirect(`/student/dashboard/billing?reason=module-access&feature=${access.requiredFeature ?? "premiumModules"}`);
  }

  const [moduleWithSections, course, progressRows] = await Promise.all([
    getModuleWithSections(moduleItem.id),
    getCourseById(moduleItem.courseId),
    getStudentProgress(session.user.id),
  ]);

  if (!moduleWithSections || !course) {
    notFound();
  }

  const progressByTopic = new Map(progressRows.map((row) => [row.topicId, row]));
  const lessons = await Promise.all(moduleWithSections.sections.map(async (lesson) => ({
    lesson,
    resources: await getResourcesByTopic(lesson.id),
    quiz: await getQuizByTopic(lesson.id),
  })));

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ModuleHeader title={moduleItem.title} description={moduleItem.description ?? "Explore this published module and its lessons."} />
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <Link href="/student/courses" className="font-semibold text-blue-700">Courses</Link>
          <span>/</span>
          <Link href={`/student/courses/${course.slug}`} className="font-semibold text-blue-700">{course.title}</Link>
          <span>/</span>
          <span>{moduleItem.title}</span>
        </div>
        <section className="grid gap-4 sm:grid-cols-3">
          <Card><p className="text-sm text-slate-500">Lessons</p><p className="mt-2 text-3xl font-semibold text-slate-950">{lessons.length}</p></Card>
          <Card><p className="text-sm text-slate-500">Resources</p><p className="mt-2 text-3xl font-semibold text-slate-950">{lessons.reduce((count, item) => count + item.resources.length, 0)}</p></Card>
          <Card><p className="text-sm text-slate-500">Access</p><p className="mt-2 text-xl font-semibold text-slate-950">{moduleItem.isPremium ? "Premium" : "Free"}</p></Card>
        </section>
        {lessons.length > 0 ? <section className="space-y-4">{lessons.map(({ lesson, resources, quiz }) => {
          const progress = progressByTopic.get(lesson.id);
          return <Card key={lesson.id} className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Lesson {lesson.order}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">{lesson.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{lesson.description ?? "Continue this published lesson."}</p>
                <p className="mt-3 text-sm text-slate-500">{progress?.status ?? "NOT_STARTED"} · {resources.length} resource(s){quiz ? " · Quiz available" : ""}</p>
              </div>
              <Link href={`/student/modules/${moduleItem.slug}/lessons/${lesson.slug}`} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Open lesson <FiChevronRight className="h-4 w-4" /></Link>
            </div>
            {resources.length > 0 ? <div className="mt-5 flex flex-wrap gap-2">{resources.map((resource) => <span key={resource.id} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"><FiFileText className="h-3.5 w-3.5" />{resource.title} · {resource.isPremium ? "Premium" : "Free"}</span>)}</div> : null}
          </Card>
        })}</section> : <EmptyState icon={<FiBookOpen className="h-6 w-6" />} title="No published lessons" description="Published lessons will appear here when they are ready." />}
      </div>
    </div>
  );
}
