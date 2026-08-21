'use client'

import { useMemo, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { PreviousOfficialPaperDTO } from '@/server/application/dto/previous-official-paper.dto'
import { archivePreviousOfficialPaperAction, createPreviousOfficialPaperAction, publishPreviousOfficialPaperAction, unpublishPreviousOfficialPaperAction, updatePreviousOfficialPaperAction } from '@/server/actions/previous-official-paper.actions'

type Option = { id: string; title: string; courseId?: string }

type Props = {
  papers: PreviousOfficialPaperDTO[]
  courses: Option[]
  modules: Option[]
}

const emptyForm = {
  courseId: '',
  moduleId: '',
  year: String(new Date().getFullYear()),
  title: '',
  paperType: 'Official PDF',
  mediaPath: '/media/',
  isPremium: false,
}

export default function PreviousOfficialPaperManager({ papers, courses, modules }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filters, setFilters] = useState({ courseId: '', moduleId: '', year: '', access: 'ALL', status: 'ALL' })
  const [isPending, startTransition] = useTransition()
  const visibleModules = form.courseId ? modules.filter((module) => module.courseId === form.courseId) : modules
  const visiblePapers = useMemo(() => papers.filter((paper) => (
    (!filters.courseId || paper.courseId === filters.courseId) &&
    (!filters.moduleId || paper.moduleId === filters.moduleId) &&
    (!filters.year || String(paper.year) === filters.year) &&
    (filters.access === 'ALL' || (filters.access === 'PREMIUM' ? paper.isPremium : !paper.isPremium)) &&
    (filters.status === 'ALL' || paper.status === filters.status)
  )), [filters, papers])

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const input = { ...form, year: Number(form.year) }
      if (editingId) {
        await updatePreviousOfficialPaperAction(editingId, input)
      } else {
        await createPreviousOfficialPaperAction(input)
      }
      setForm(emptyForm)
      setEditingId(null)
      router.refresh()
    })
  }

  function beginEdit(paper: PreviousOfficialPaperDTO) {
    setEditingId(paper.id)
    setForm({ courseId: paper.courseId, moduleId: paper.moduleId, year: String(paper.year), title: paper.title, paperType: paper.paperType, mediaPath: paper.mediaPath, isPremium: paper.isPremium })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submitCreate} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-4">
        <select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value, moduleId: '' })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">Exam / course</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
        <select required value={form.moduleId} onChange={(event) => setForm({ ...form, moduleId: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">Subject / module</option>
          {visibleModules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
        </select>
        <input required type="number" min="1950" max={new Date().getFullYear() + 1} value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} placeholder="Year" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Paper title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input required value={form.paperType} onChange={(event) => setForm({ ...form, paperType: event.target.value })} placeholder="Paper type" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input required value={form.mediaPath} onChange={(event) => setForm({ ...form, mediaPath: event.target.value })} placeholder="/media/paper.pdf" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><input type="checkbox" checked={form.isPremium} onChange={(event) => setForm({ ...form, isPremium: event.target.checked })} /> Premium</label>
        <button disabled={isPending} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{editingId ? 'Save paper' : 'Create paper'}</button>{editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button> : null}
      </form>

      <div className="flex flex-wrap gap-2">
        <select value={filters.courseId} onChange={(event) => setFilters({ ...filters, courseId: event.target.value, moduleId: '' })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All exams</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select>
        <select value={filters.moduleId} onChange={(event) => setFilters({ ...filters, moduleId: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All subjects</option>{modules.filter((module) => !filters.courseId || module.courseId === filters.courseId).map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}</select>
        <input value={filters.year} onChange={(event) => setFilters({ ...filters, year: event.target.value })} placeholder="Year" className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select value={filters.access} onChange={(event) => setFilters({ ...filters, access: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="ALL">Free and premium</option><option value="FREE">Free</option><option value="PREMIUM">Premium</option></select>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="ALL">All status</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Paper</th><th className="px-4 py-3">Exam / subject</th><th className="px-4 py-3">Access</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{visiblePapers.map((paper) => <tr key={paper.id} className="border-t border-slate-200"><td className="px-4 py-3"><p className="font-semibold">{paper.year} - {paper.title}</p><p className="text-xs text-slate-500">{paper.paperType} · {paper.mediaPath}</p></td><td className="px-4 py-3">{paper.courseTitle} · {paper.moduleTitle}</td><td className="px-4 py-3">{paper.isPremium ? 'Premium' : 'Free'}</td><td className="px-4 py-3">{paper.status}</td><td className="flex flex-wrap gap-2 px-4 py-3"><button type="button" disabled={isPending} onClick={() => beginEdit(paper)} className="rounded border border-slate-300 px-2 py-1 text-xs">Edit</button>{paper.status === 'PUBLISHED' ? <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await unpublishPreviousOfficialPaperAction(paper.id); router.refresh() })} className="rounded border border-slate-300 px-2 py-1 text-xs">Unpublish</button> : <button type="button" disabled={isPending} onClick={() => startTransition(async () => { await publishPreviousOfficialPaperAction(paper.id); router.refresh() })} className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700">Publish</button>}<button type="button" disabled={isPending} onClick={() => startTransition(async () => { await archivePreviousOfficialPaperAction(paper.id); router.refresh() })} className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-700">Archive</button></td></tr>)}</tbody></table>
      </div>
    </div>
  )
}
