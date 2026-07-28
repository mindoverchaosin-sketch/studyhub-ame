import { redirect } from "next/navigation";
import { requirePermission } from "@/auth";
import AdminLayout from "@/components/admin/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { ModuleManagementService } from "@/server/services/module-management.service";
import { archiveModuleAction, unarchiveModuleAction, updateModuleAction } from "@/server/actions/content-management.actions";
import { approvePublishingAction, archiveContentAction, publishContentAction, rejectPublishingAction, submitForReviewAction, unpublishContentAction } from "@/server/actions/publishing.actions";
import { StudyMaterialManagementService } from "@/server/services/study-material-management.service";
import ModuleResourcesPanel from "@/components/admin/modules/ModuleResourcesPanel";

export default async function ModuleDetailPage({ params }: { params: Promise<{ moduleId: string }> }) {
  try {
    await requirePermission('manageModules');
  } catch {
    redirect("/login");
  }

  const { moduleId } = await params;
  const service = new ModuleManagementService();
  const resourceService = new StudyMaterialManagementService();
  const module = await service.getModuleDetail(moduleId);
  const resources = await resourceService.listResources(moduleId);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title={module.title} description="Inspect module metadata, publication state, and resource counts." />

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Module metadata</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Status</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{module.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Exam type</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{module.examType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Resources</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{module.resources.length}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Last updated</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{new Date(module.updatedAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Slug</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{module.slug}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Module number</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{module.moduleNumber}</dd>
              </div>
            </dl>
            <p className="mt-6 text-sm text-slate-600">{module.description || "No description provided."}</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Manage module</h2>
            <form action={async (formData: FormData) => {
              'use server';
              await updateModuleAction(moduleId, {
                title: String(formData.get('title') ?? ''),
                slug: String(formData.get('slug') ?? ''),
                moduleNumber: String(formData.get('moduleNumber') ?? ''),
                description: String(formData.get('description') ?? ''),
                status: String(formData.get('status') ?? 'DRAFT'),
                difficulty: String(formData.get('difficulty') ?? 'BEGINNER'),
                estimatedHours: Number(formData.get('estimatedHours') ?? 0),
                displayOrder: Number(formData.get('displayOrder') ?? 0),
              });
            }} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Title</span>
                <input name="title" defaultValue={module.title} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Slug</span>
                <input name="slug" defaultValue={module.slug} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Module number</span>
                <input name="moduleNumber" defaultValue={module.moduleNumber} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Status</span>
                <select name="status" defaultValue={module.status} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500">
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Difficulty</span>
                <select name="difficulty" defaultValue={module.difficulty} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Estimated hours</span>
                <input name="estimatedHours" type="number" defaultValue={module.estimatedHours} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Display order</span>
                <input name="displayOrder" type="number" defaultValue={module.displayOrder} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                <span className="mb-2 block">Description</span>
                <textarea name="description" rows={3} defaultValue={module.description} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
              </label>
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save changes</button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              {module.status === "ARCHIVED" ? (
                <form action={async () => { 'use server'; await unarchiveModuleAction(moduleId); }}>
                  <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Unarchive</button>
                </form>
              ) : (
                <>
                  <form action={async () => { 'use server'; await submitForReviewAction('MODULE', moduleId); }}>
                    <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Submit for review</button>
                  </form>
                  <form action={async () => { 'use server'; await approvePublishingAction('MODULE', moduleId); }}>
                    <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Approve</button>
                  </form>
                  <form action={async () => { 'use server'; await rejectPublishingAction('MODULE', moduleId, 'Needs revision'); }}>
                    <button type="submit" className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700">Reject</button>
                  </form>
                  <form action={async () => { 'use server'; await publishContentAction('MODULE', moduleId); }}>
                    <button type="submit" className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700">Publish</button>
                  </form>
                  <form action={async () => { 'use server'; await unpublishContentAction('MODULE', moduleId); }}>
                    <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Unpublish</button>
                  </form>
                  <form action={async () => { 'use server'; await archiveContentAction('MODULE', moduleId); }}>
                    <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Archive</button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        <ModuleResourcesPanel resources={resources} />
      </div>
    </AdminLayout>
  );
}
