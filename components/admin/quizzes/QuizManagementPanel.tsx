'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/admin/cms/Modal'
import { StatusBadge } from '@/components/admin/cms/StatusBadge'
import {
  createAdminQuiz,
  setCanonicalModuleQuiz,
  setAdminQuizStatus,
  updateAdminQuiz,
} from '@/server/actions/quiz-management.actions'

type ModuleOption = { id: string; title: string }
type QuestionBankOption = { id: string; title: string; status: string; questionCount: number }
type QuizItem = {
  id: string
  moduleId: string
  moduleTitle: string
  canonicalQuizId: string | null
  title: string
  description: string | null
  status: string
  passingScore: number
  timeLimitMinutes: number
  questionBankIds: string[]
  questionBankTitles: string[]
  attemptCount: number
  updatedAt: string
}

type Props = {
  initialQuizzes: QuizItem[]
  modules: ModuleOption[]
  questionBanks: QuestionBankOption[]
  initialModuleId?: string
}

type Draft = {
  moduleId: string
  title: string
  description: string
  passingScore: number
  timeLimitMinutes: number
  questionBankIds: string[]
}

export function QuizManagementPanel({ initialQuizzes, modules, questionBanks, initialModuleId }: Props) {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState(initialQuizzes)
  const [moduleFilter, setModuleFilter] = useState(initialModuleId ?? 'ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialModuleId ?? modules[0]?.id ?? ''))
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const visibleQuizzes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return quizzes.filter((quiz) => (
      (moduleFilter === 'ALL' || quiz.moduleId === moduleFilter)
      && (statusFilter === 'ALL' || quiz.status === statusFilter)
      && (!normalizedSearch || `${quiz.title} ${quiz.description ?? ''} ${quiz.moduleTitle}`.toLowerCase().includes(normalizedSearch))
    ))
  }, [quizzes, moduleFilter, statusFilter, search])

  function openCreate() {
    setSelectedQuiz(null)
    setDraft(emptyDraft(initialModuleId ?? (moduleFilter === 'ALL' ? modules[0]?.id ?? '' : moduleFilter)))
    setMessage(null)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(quiz: QuizItem) {
    setSelectedQuiz(quiz)
    setDraft({
      moduleId: quiz.moduleId,
      title: quiz.title,
      description: quiz.description ?? '',
      passingScore: quiz.passingScore,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questionBankIds: quiz.questionBankIds,
    })
    setMessage(null)
    setError(null)
    setModalOpen(true)
  }

  async function saveQuiz() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const saved = selectedQuiz
        ? await updateAdminQuiz(selectedQuiz.id, draft)
        : await createAdminQuiz(draft)
      const moduleTitle = modules.find((module) => module.id === draft.moduleId)?.title ?? ''
      const bankTitles = questionBanks.filter((bank) => draft.questionBankIds.includes(bank.id)).map((bank) => bank.title)
      const quiz: QuizItem = {
        id: saved.id,
        moduleId: draft.moduleId,
        moduleTitle,
        canonicalQuizId: selectedQuiz?.canonicalQuizId ?? null,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        status: selectedQuiz?.status ?? 'DRAFT',
        passingScore: draft.passingScore,
        timeLimitMinutes: draft.timeLimitMinutes,
        questionBankIds: draft.questionBankIds,
        questionBankTitles: bankTitles,
        attemptCount: selectedQuiz?.attemptCount ?? 0,
        updatedAt: new Date().toISOString(),
      }
      setQuizzes((current) => selectedQuiz
        ? current.map((item) => item.id === quiz.id ? quiz : item)
        : [quiz, ...current])
      setModalOpen(false)
      setMessage(selectedQuiz ? 'Quiz updated.' : 'Quiz created as a draft.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save quiz.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus(quiz: QuizItem, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await setAdminQuizStatus(quiz.id, status)
      setQuizzes((current) => current.map((item) => item.id === quiz.id ? { ...item, status } : item))
      setMessage(`Quiz ${status === 'DRAFT' ? 'unpublished' : status.toLowerCase()}.`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update quiz status.')
    } finally {
      setBusy(false)
    }
  }

  async function changeCanonicalQuiz(quiz: QuizItem, canonicalQuizId: string | null) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await setCanonicalModuleQuiz(quiz.moduleId, canonicalQuizId)
      setQuizzes((current) => current.map((item) => (
        item.moduleId === quiz.moduleId ? { ...item, canonicalQuizId } : item
      )))
      setMessage(canonicalQuizId ? `${quiz.title} is now the module's learner quiz.` : 'The module learner quiz was cleared.')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the module learner quiz.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Module content</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">Quizzes</h1>
          <p className="mt-2 text-sm text-slate-600">Quizzes belong to modules and use reusable Question Banks.</p>
        </div>
        <button type="button" onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create quiz</button>
      </div>

      {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}

      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input aria-label="Search quizzes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search quizzes" className="min-w-48 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        <select aria-label="Filter quizzes by module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="ALL">All modules</option>
          {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
        </select>
        <select aria-label="Filter quizzes by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_REVIEW">In review</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
          <option value="SCHEDULED">Scheduled</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="px-4 py-3">Quiz</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Question Banks</th><th className="px-4 py-3">Attempts</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Learner quiz</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleQuizzes.map((quiz) => (
              <tr key={quiz.id}>
                <td className="px-4 py-4"><p className="font-semibold text-slate-950">{quiz.title}</p><p className="mt-1 text-xs text-slate-500">Updated {new Date(quiz.updatedAt).toLocaleDateString()}</p></td>
                <td className="px-4 py-4 text-slate-700">{quiz.moduleTitle}</td>
                <td className="px-4 py-4 text-slate-700">{quiz.questionBankTitles.length ? quiz.questionBankTitles.join(', ') : 'None'}</td>
                <td className="px-4 py-4 text-slate-700">{quiz.attemptCount}</td>
                <td className="px-4 py-4"><StatusBadge status={quiz.status} /></td>
                <td className="px-4 py-4">
                  {quiz.canonicalQuizId === quiz.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700">Canonical</span>
                      <button type="button" onClick={() => changeCanonicalQuiz(quiz, null)} disabled={busy} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">Clear</button>
                    </div>
                  ) : quiz.status === 'PUBLISHED' ? (
                    <button type="button" onClick={() => changeCanonicalQuiz(quiz, quiz.id)} disabled={busy} className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">Set canonical</button>
                  ) : (
                    <span className="text-xs text-slate-500">Publish to designate</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEdit(quiz)} disabled={busy} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">Edit</button>
                    {quiz.status === 'PUBLISHED' ? (
                      <button type="button" onClick={() => changeStatus(quiz, 'DRAFT')} disabled={busy} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">Unpublish</button>
                    ) : quiz.status !== 'ARCHIVED' ? (
                      <button type="button" onClick={() => changeStatus(quiz, 'PUBLISHED')} disabled={busy} className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">Publish</button>
                    ) : null}
                    {quiz.status !== 'ARCHIVED' ? (
                      <button type="button" onClick={() => changeStatus(quiz, 'ARCHIVED')} disabled={busy} className="rounded-full border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">Archive</button>
                    ) : null}
                    {quiz.status === 'ARCHIVED' ? (
                      <button type="button" onClick={() => changeStatus(quiz, 'DRAFT')} disabled={busy} className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold">Restore draft</button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!visibleQuizzes.length ? <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-600">No quizzes match the selected filters.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={selectedQuiz ? 'Edit quiz' : 'Create quiz'}
        description="Select a module and the reusable question banks this quiz should draw from."
        onClose={() => setModalOpen(false)}
        footer={(
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} disabled={busy} className="rounded-full border border-slate-300 px-4 py-2 text-sm">Cancel</button>
            <button type="button" onClick={saveQuiz} disabled={busy} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{busy ? 'Saving...' : 'Save draft'}</button>
          </div>
        )}
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Module
            {initialModuleId ? (
              <span className="mt-1 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">{modules.find((module) => module.id === draft.moduleId)?.title ?? 'Selected module'}</span>
            ) : (
              <select value={draft.moduleId} onChange={(event) => setDraft((current) => ({ ...current, moduleId: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2">
                <option value="">Select a module</option>
                {modules.map((module) => <option key={module.id} value={module.id}>{module.title}</option>)}
              </select>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">Title<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
          <label className="block text-sm font-medium text-slate-700">Description<textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Passing score (%)<input type="number" min="0" max="100" value={draft.passingScore} onChange={(event) => setDraft((current) => ({ ...current, passingScore: event.target.valueAsNumber }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
            <label className="block text-sm font-medium text-slate-700">Time limit (minutes)<input type="number" min="0" value={draft.timeLimitMinutes} onChange={(event) => setDraft((current) => ({ ...current, timeLimitMinutes: event.target.valueAsNumber }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-800">Question banks</legend>
            <p className="text-xs text-slate-500">Banks may be reused by multiple modules and assessment types.</p>
            {questionBanks.map((bank) => (
              <label key={bank.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                <input type="checkbox" checked={draft.questionBankIds.includes(bank.id)} onChange={(event) => setDraft((current) => ({
                  ...current,
                  questionBankIds: event.target.checked
                    ? [...new Set([...current.questionBankIds, bank.id])]
                    : current.questionBankIds.filter((id) => id !== bank.id),
                }))} />
                <span><span className="font-medium text-slate-800">{bank.title}</span><span className="mt-1 block text-xs text-slate-500">{bank.questionCount} questions · {bank.status}</span></span>
              </label>
            ))}
            {!questionBanks.length ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No question banks are available. You may save this draft and associate a bank later.</p> : null}
          </fieldset>
        </div>
      </Modal>
    </div>
  )
}

function emptyDraft(moduleId: string): Draft {
  return { moduleId, title: '', description: '', passingScore: 70, timeLimitMinutes: 0, questionBankIds: [] }
}
