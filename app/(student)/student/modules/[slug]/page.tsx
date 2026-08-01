import { notFound } from "next/navigation";
import ModuleHeader from "@/components/modules/ModuleHeader";
import ModuleDetailShell from "@/components/modules/ModuleDetailShell";
import LessonTimeline from "@/components/modules/LessonTimeline";
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

        <ModuleDetailShell moduleItem={moduleItem} />
        <LessonTimeline lessons={moduleItem.lessons} moduleSlug={moduleItem.slug} />
      </div>
    </div>
  );
}
