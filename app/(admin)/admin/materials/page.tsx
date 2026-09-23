import { redirect } from "next/navigation";
import { requirePermission } from '@/auth'import PageHeader from "@/components/admin/PageHeader";
import Link from 'next/link'
import StudyMaterialCmsList from '@/components/admin/StudyMaterialCmsList'
import { resourceRepository } from '@/server/repositories/resource.repository'

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  try {
    await requirePermission('manageResources')
  } catch {
    redirect('/login')
  }
  const filters = await searchParams
  const status = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'].includes(filters.status ?? '') ? filters.status as 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED' : 'ALL'
  const resources = await resourceRepository.findForAdmin({ search: filters.search, status })
  return (
    <div className="space-y-6">
        <PageHeader title="Study materials" description="Create, review, and publish structured AeroPrep learning materials." />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="flex flex-wrap gap-2"><input name="search" defaultValue={filters.search} placeholder="Search materials" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" /><select name="status" defaultValue={status} className="rounded-xl border border-slate-300 px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="DRAFT">Draft</option><option value="IN_REVIEW">In review</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select><button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button></form>
          <Link href="/admin/materials/new" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">New study material</Link>
        </div>
        <StudyMaterialCmsList resources={resources.map((resource) => ({ id: resource.id, moduleId: resource.moduleId, lessonId: resource.lessonId, title: resource.title, description: null, type: resource.materialType, url: resource.url ?? '', isPremium: resource.isPremium, status: resource.status, publishedAt: resource.publishedAt, createdAt: resource.createdAt, updatedAt: resource.updatedAt }))} />
      </div>
  );
}
