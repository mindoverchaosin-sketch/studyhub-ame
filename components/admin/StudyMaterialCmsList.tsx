import Link from 'next/link'
import type { ResourceDTO } from '@/server/application/dto/resource.dto'

export default function StudyMaterialCmsList({ resources, basePath = '/admin' }: { resources: ResourceDTO[]; basePath?: '/admin' | '/content-editor' }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500"><tr><th className="px-5 py-3">Title</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Access</th><th className="px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{resources.map((resource) => <tr key={resource.id}><td className="px-5 py-4 font-semibold text-slate-900">{resource.title}</td><td className="px-5 py-4 text-slate-600">{resource.type}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{resource.status}</span></td><td className="px-5 py-4 text-slate-600">{resource.isPremium ? 'Premium' : 'Free'}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-3"><Link href={`${basePath}/materials/${resource.id}`} className="font-semibold text-blue-700">Edit</Link><Link href={`${basePath}/materials/${resource.id}/preview`} className="font-semibold text-slate-700">Preview</Link></div></td></tr>)}{resources.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No study materials match the current filters.</td></tr> : null}</tbody></table></div>
    </div>
  )
}
