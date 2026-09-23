import { redirect } from "next/navigation";
import { requirePermission } from "@/auth";import PageHeader from "@/components/admin/PageHeader";
import ModuleDirectoryPanel from "@/components/admin/modules/ModuleDirectoryPanel";
import { createModuleFormAction } from "@/server/actions/content-management.actions";
import { ModuleManagementService } from "@/server/services/module-management.service";

export default async function ModulesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  try {
    await requirePermission('manageModules');
  } catch {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const query = typeof params.query === "string" ? params.query : "";
  const examType = typeof params.examType === "string" ? params.examType : "ALL";
  const status = typeof params.status === "string" ? params.status : "ALL";
  const sortBy = typeof params.sortBy === "string" ? params.sortBy : "updated";
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;

  const service = new ModuleManagementService();
  const directory = await service.listModules({
    search: query,
    examType: examType === "DGCA" || examType === "EASA" || examType === "BOTH" ? examType : "ALL",
    status: status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED" || status === "SCHEDULED" ? status : "ALL",
    sortBy: sortBy === "title" || sortBy === "created" ? sortBy : "updated",
    page,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
        <PageHeader
          title="Module management"
          description="Create, edit, and archive training modules without changing student-facing learning experiences."
        />

        <form action={async (formData: FormData) => {
          'use server';
          await createModuleFormAction(formData);
        }} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create module</h2>
              <p className="mt-1 text-sm text-slate-600">Create a new module with a title, slug, and exam pathway.</p>
            </div>
            <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Create module</button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Title</span>
              <input name="title" required className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Slug</span>
              <input name="slug" required className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Module number</span>
              <input name="moduleNumber" required className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Course ID</span>
              <input name="courseId" required className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Status</span>
              <select name="status" defaultValue="DRAFT" className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Difficulty</span>
              <select name="difficulty" defaultValue="BEGINNER" className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Estimated hours</span>
              <input type="number" name="estimatedHours" defaultValue={0} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-2 block">Display order</span>
              <input type="number" name="displayOrder" defaultValue={0} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              <span className="mb-2 block">Description</span>
              <textarea name="description" rows={3} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
            </label>
          </div>
        </form>

        <ModuleDirectoryPanel directory={directory} query={query} examType={examType} status={status} sortBy={sortBy} page={page} />
      </div>
  );
}
