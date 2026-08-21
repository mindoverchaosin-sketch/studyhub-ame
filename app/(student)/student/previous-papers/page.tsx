import Link from 'next/link'
import { requireStudent } from '@/auth'
import { contentAccessService } from '@/server/services/content-access.service'
import { courseRepository } from '@/server/repositories/course.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { previousOfficialPaperService } from '@/server/services/previous-official-paper.service'

export default async function StudentPreviousPapersPage({ searchParams }: { searchParams: Promise<{ courseId?: string; moduleId?: string; year?: string; access?: string }> }) {
  const session = await requireStudent()
  const filters = await searchParams
  const year = filters.year ? Number(filters.year) : undefined
  const papers = await previousOfficialPaperService.listForStudent({
    courseId: filters.courseId,
    moduleId: filters.moduleId,
    year: Number.isInteger(year) ? year : undefined,
    isPremium: filters.access === 'PREMIUM' ? true : filters.access === 'FREE' ? false : undefined,
  })
  const [courses, modules] = await Promise.all([courseRepository.findAllPublished(), moduleRepository.findAll()])
  const accessResults = await Promise.all(papers.map((paper) => contentAccessService.canAccessStudyMaterial(session.user.id, paper.isPremium)))

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">Official archive</p>
          <h1 className="mt-2 text-3xl font-semibold">Previous question papers</h1>
          <p className="mt-2 text-slate-600">Browse published official papers by exam, subject, year, and access level.</p>
        </div>
        <form method="get" className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          <select name="courseId" defaultValue={filters.courseId ?? ''} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All exams</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
          <select name="moduleId" defaultValue={filters.moduleId ?? ''} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All subjects</option>
            {modules.filter((module) => !filters.courseId || module.courseId === filters.courseId).map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
          </select>
          <input name="year" defaultValue={filters.year ?? ''} placeholder="Year" className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="access" defaultValue={filters.access ?? ''} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Free and premium</option>
            <option value="FREE">Free</option>
            <option value="PREMIUM">Premium</option>
          </select>
          <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Filter</button>
        </form>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {papers.map((paper, index) => {
            const locked = paper.isPremium && !accessResults[index].allowed
            return <article key={paper.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blue-700">{paper.year} · {paper.paperType}</p>
                  <h2 className="mt-2 text-lg font-semibold">{paper.title}</h2>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${paper.isPremium ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{paper.isPremium ? 'Premium' : 'Free'}</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{paper.courseTitle} · {paper.moduleTitle}</p>
              <div className="mt-5">{locked ? <Link href="/student/dashboard/billing?reason=previous-paper-access&feature=premiumModules" className="font-semibold text-amber-700">Upgrade to access</Link> : <Link target="_blank" rel="noreferrer" href={`/api/student/previous-papers/${paper.id}`} className="font-semibold text-blue-700">View paper</Link>}</div>
            </article>
          })}
        </section>
        {papers.length === 0 ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No published papers match these filters.</p> : null}
      </main>
    </div>
  )
}
