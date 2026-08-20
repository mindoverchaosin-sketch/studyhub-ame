import { listExamTemplates } from '@/server/actions/exam.actions'
import type { MockTestTemplate } from '@/lib/mock/exams'
import Link from 'next/link'
import { requireStudent } from '@/auth'
import { contentAccessService } from '@/server/services/content-access.service'
import type { ExamTemplateDTO } from '@/server/application/dto/exam-template.dto'

type StudentMockTestTemplate = MockTestTemplate & { isPremium?: boolean }

export default async function StudentMockExamsPage() {
  const session = await requireStudent()
  const templates: ExamTemplateDTO[] = await listExamTemplates({ active: true, pageSize: 50 })
  // fallback to mock templates when backend has no active templates
  const { mockExamTemplates } = await import('@/lib/mock/exams')
  const items: StudentMockTestTemplate[] = templates.length > 0
    ? templates.map((template) => ({
      id: template.id,
      title: template.name,
      description: template.description ?? 'Timed practice for your exam preparation.',
      examType: 'DGCA' as const,
      questionCount: template.questionCount,
      durationMinutes: template.durationMinutes,
      difficulty: 'Intermediate' as const,
      passingScore: template.passingPercentage,
      status: 'NOT_STARTED' as const,
      attempts: 0,
      bestScore: 0,
      lastAttempted: '',
      topicCoverage: [],
      isPremium: template.isPremium,
    }))
    : mockExamTemplates
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
        {items.map((t: StudentMockTestTemplate) => (
          <li key={t.id} className="list-none">
            <div className="h-full rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{t.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{t.description}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${t.isPremium ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{t.isPremium ? 'Premium' : 'Free'}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{t.difficulty}</span>
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
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Pass {t.passingScore}%</span>
                {t.isPremium && resolvedAccessByTemplateId.get(t.id)?.allowed === false ? <Link href="/student/dashboard/billing" className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800">Upgrade</Link> : <Link href={templates.length > 0 ? `/student/mock-exams/${t.id}/start` : `/student/mock-exams/demo/${t.id}`} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  {templates.length > 0 ? 'Start exam' : 'Start demo'}
                </Link>}
              </div>
            </div>
          </li>
        ))}
      </div>
    </div>
  )
}
