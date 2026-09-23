import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";import { LessonsManager } from "@/components/admin/cms/LessonsManager";
import { CmsSearchPanel } from "@/components/admin/cms/CmsSearchPanel";
import { cmsSearchService } from "@/server/services/cms-search.service";

const sampleItems = [
  { id: 'lesson-1', type: 'lesson' as const, title: 'Corrosion Basics', subtitle: 'Lesson content', status: 'Published' },
  { id: 'module-1', type: 'module' as const, title: 'Hydraulic Systems', subtitle: 'Module content', status: 'Draft' },
  { id: 'question-1', type: 'question' as const, title: 'Hydraulic question', subtitle: 'Question bank', status: 'Published' },
  { id: 'media-1', type: 'media' as const, title: 'Guide.pdf', subtitle: 'Media library', status: 'Draft' },
];

export default async function LessonsPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  const searchItems = cmsSearchService.search(sampleItems, '', 'all', 'all');

  return (
    <div className="space-y-8">
        <LessonsManager />
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Unified content search</h2>
          <p className="mt-2 text-sm text-slate-600">Search lessons, modules, questions, mock tests, and media from one place.</p>
          <div className="mt-4">
            <CmsSearchPanel items={searchItems} />
          </div>
        </div>
      </div>
  );
}
