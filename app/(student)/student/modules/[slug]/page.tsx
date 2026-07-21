import { notFound } from "next/navigation";
import { FiBookOpen, FiFileText, FiPlayCircle } from "react-icons/fi";
import DashboardSection from "@/components/dashboard/DashboardSection";
import ModuleHeader from "@/components/modules/ModuleHeader";
import ModuleProgress from "@/components/modules/ModuleProgress";
import LessonList from "@/components/modules/LessonList";
import { mockModules } from "@/lib/mock/modules";

export default async function StudentModuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const moduleItem = mockModules.find((item) => item.slug === slug);

  if (!moduleItem) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ModuleHeader title={moduleItem.title} description={moduleItem.description} />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <DashboardSection title="Module overview" description={moduleItem.summary}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FiBookOpen className="h-4 w-4" />
                    {moduleItem.estimatedHours}h
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Estimated study</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FiPlayCircle className="h-4 w-4" />
                    {moduleItem.lessonsCount}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Lessons</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FiFileText className="h-4 w-4" />
                    {moduleItem.resourcesCount}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Resources</p>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection title="Learning objectives" description="What you will strengthen in this module.">
              <ul className="space-y-3">
                {moduleItem.objectives.map((objective) => (
                  <li key={objective} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {objective}
                  </li>
                ))}
              </ul>
            </DashboardSection>
          </div>

          <div className="space-y-6">
            <ModuleProgress moduleItem={moduleItem} />
            <LessonList lessons={moduleItem.lessons} />
          </div>
        </div>
      </div>
    </div>
  );
}
