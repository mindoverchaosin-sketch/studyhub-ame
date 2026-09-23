import { listStudentExamTemplates } from '@/server/actions/exam.actions'
import Link from 'next/link'
import { requireStudent } from '@/auth'
import { contentAccessService } from '@/server/services/content-access.service'
import EmptyState from '@/components/dashboard/EmptyState'

export default async function StudentMockExamsPage() {
  const session = await requireStudent()
  const templates = await listStudentExamTemplates({ pageSize: 50 })
  const accessByTemplateId = new Map(
    templates.map((template) => [
      template.id,
      contentAccessService.canAccessExamTemplate(session.user.id, Boolean(template.isPremium), template.moduleId ? 'module' : 'standalone'),
    ])
  )
  const accessResults = await Promise.all(accessByTemplateId.values())
  const accessEntries = Array.from(accessByTemplateId.keys()).map((id, index) => [id, accessResults[index]] as const)
  const resolvedAccessByTemplateId = new Map(accessEntries)

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mock Exams</h1>
          <p className="text-sm text-slate-600">Start a timed mock, track history, and analyze your strengths.</p>
        </div>
        <Link href="/student/mock-exams/history" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">View history</Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <li key={t.id} className="list-none">
            <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t.name}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{t.description ?? 'Timed practice for your exam preparation.'}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${t.isPremium ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{t.isPremium ? 'Premium' : 'Free'}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Questions</p>
                  <p className="mt-2">{t.questionCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Duration</p>
                  <p className="mt-2">{t.durationMinutes} min</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Pass {t.passingPercentage}%</span>
                {t.isPremium && resolvedAccessByTemplateId.get(t.id)?.allowed === false ? <Link href="/student/dashboard/billing" className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800">Upgrade</Link> : <Link href={`/student/mock-exams/start/${t.id}`} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Start exam
                </Link>}
              </div>
            </div>
          </li>
        ))}
      </div>
      {templates.length === 0 ? <EmptyState title="No mock exams available" description="Published mock exams will appear here when they are ready." /> : null}
    </div>
  )
}
