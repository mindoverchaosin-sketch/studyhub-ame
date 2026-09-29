import Link from "next/link"
import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import { analyticsService } from "@/server/services/analytics.service"

export default async function SuperAdminPublishingPage() {
  const publishing = await analyticsService.getPublishingAnalytics()
  const contentTypes = Object.entries(publishing.byEntityType)

  return (
    <div>
      <SuperAdminPageHeader title="Publishing" description="Content inventory and publication status from the existing publishing analytics service." />
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Publishing totals">
        <Metric label="Published" value={publishing.publishedCount} tone="emerald" />
        <Metric label="Draft" value={publishing.draftCount} tone="slate" />
        <Metric label="Archived" value={publishing.archivedCount} tone="amber" />
      </section>
      <section className="mt-6 overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-950">Status by content type</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th scope="col" className="px-5 py-3">Type</th><th scope="col" className="px-5 py-3">Draft</th><th scope="col" className="px-5 py-3">Published</th><th scope="col" className="px-5 py-3">Archived</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {contentTypes.map(([type, counts]) => <tr key={type}><th scope="row" className="px-5 py-3 font-medium text-slate-800">{type}</th><td className="px-5 py-3 tabular-nums">{counts.draft}</td><td className="px-5 py-3 tabular-nums">{counts.published}</td><td className="px-5 py-3 tabular-nums">{counts.archived}</td></tr>)}
            </tbody>
          </table>
        </div>
        {!contentTypes.length ? <p className="px-5 py-8 text-sm text-slate-500">No publishing inventory is available.</p> : null}
      </section>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/admin/modules" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Manage modules</Link>
        <Link href="/admin/materials" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Manage study materials</Link>
        <Link href="/admin/questions" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Manage questions</Link>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "emerald" | "slate" | "amber" }) {
  const valueTone = { emerald: "text-emerald-800", slate: "text-slate-900", amber: "text-amber-800" }[tone]
  return <article className="rounded-md border border-slate-200 bg-white p-4"><h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h2><p className={`mt-3 text-2xl font-semibold tabular-nums ${valueTone}`}>{value.toLocaleString()}</p></article>
}