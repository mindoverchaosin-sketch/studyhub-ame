"use client"

import { useMemo, useState, type FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import {
  archiveQuestionAction,
  bulkArchiveQuestions,
  bulkPublishQuestions,
  bulkRestoreQuestions,
  bulkUnpublishQuestions,
  bulkUpdateQuestionDifficulty,
  bulkUpdateQuestionModule,
  bulkUpdateQuestionTags,
  createQuestionAction,
  exportQuestions,
  getQuestionAction,
  importQuestions,
  updateQuestionAction,
} from '@/server/actions/question-management.actions'
import { approvePublishingAction, archiveContentAction, publishContentAction, rejectPublishingAction, submitForReviewAction, unpublishContentAction } from '@/server/actions/publishing.actions'
import type { QuestionDTO } from '@/server/application/dto/question.dto'

type Props = {
  initialQuestions: Array<QuestionDTO & { status: string; metadata: { tags: string[]; timeEstimateMinutes: number }; createdAt: string }>
  initialTotal: number
  questionBanks: Array<{ id: string; title: string }>
}

export default function QuestionBankDirectoryPanel({ initialQuestions, initialTotal, questionBanks }: Props) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [difficultyFilter, setDifficultyFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(initialQuestions[0]?.id ?? null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(0)
  const [explanation, setExplanation] = useState('')
  const [questionBankId, setQuestionBankId] = useState(questionBanks[0]?.id ?? '')
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER')
  const [bulkModuleId, setBulkModuleId] = useState(questionBanks[0]?.id ?? '')
  const [bulkDifficulty, setBulkDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER')
  const [bulkTags, setBulkTags] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importContent, setImportContent] = useState('')
  const [importSummary, setImportSummary] = useState<{ successCount: number; failureCount: number; validationErrors: string[] } | null>(null)
  const { data: session } = useSession()
  const role = (session?.user?.role as string | undefined) ?? 'STUDENT'
  const canManageQuestions = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CONTENT_MANAGER' || role === 'QUESTION_REVIEWER'
  const canPublishQuestions = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CONTENT_MANAGER' || role === 'QUESTION_REVIEWER'

  const visibleQuestions = useMemo(() => {
    const lower = search.trim().toLowerCase()
    return questions.filter((question) => {
      const matchesSearch = !lower || question.question.toLowerCase().includes(lower)
      const matchesModule = moduleFilter === 'ALL' || question.questionBankId === moduleFilter
      const matchesDifficulty = difficultyFilter === 'ALL' || question.difficulty === difficultyFilter
      const matchesStatus = statusFilter === 'ALL' || question.status === statusFilter
      return matchesSearch && matchesModule && matchesDifficulty && matchesStatus
    })
  }, [questions, search, moduleFilter, difficultyFilter, statusFilter])

  const selectedQuestion = visibleQuestions.find((question) => question.id === selectedQuestionId) ?? null

  function resetForm() {
    setSelectedQuestionId(null)
    setPrompt('')
    setOptions(['', ''])
    setCorrectOptionIndex(0)
    setExplanation('')
    setQuestionBankId(questionBanks[0]?.id ?? '')
    setDifficulty('BEGINNER')
    setErrors([])
    setMessage('')
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setErrors([])
    setMessage('')

    const result = selectedQuestionId
      ? await updateQuestionAction(selectedQuestionId, { prompt, options, correctOptionIndex, questionBankId, difficulty, explanation, status: 'DRAFT' })
      : await createQuestionAction({ prompt, options, correctOptionIndex, questionBankId, difficulty, explanation, status: 'DRAFT' })

    if (!result.success) {
      setErrors(result.errors.map((error) => error.message))
      return
    }

    if (result.question) {
      setQuestions((current) => {
        const existingIndex = current.findIndex((question) => question.id === result.question?.id)
        if (existingIndex >= 0) {
          return current.map((question) => (question.id === result.question?.id ? result.question! : question))
        }

        return [result.question!, ...current]
      })
      setSelectedQuestionId(result.question.id)
    }

    setMessage(selectedQuestionId ? 'Question updated.' : 'Question created.')
  }

  async function handleArchive() {
    if (!selectedQuestionId) return
    const result = await archiveQuestionAction(selectedQuestionId)
    if (result.success) {
      setQuestions((current) => current.map((question) => (question.id === selectedQuestionId ? { ...question, status: 'ARCHIVED' } : question)))
      setMessage('Question archived.')
    }
  }

  async function handleSelectQuestion(questionId: string) {
    setSelectedQuestionId(questionId)
    const result = await getQuestionAction(questionId)
    if (result.success && result.question) {
      setPrompt(result.question.question)
      setOptions(result.question.options.map((option) => option.text))
      setCorrectOptionIndex(result.question.options.findIndex((option) => option.text === result.question?.correctAnswer))
      setExplanation(result.question.explanation ?? '')
      setQuestionBankId(result.question.questionBankId)
      setDifficulty(result.question.difficulty)
    }
  }

  function toggleSelection(questionId: string) {
    setSelectedQuestionIds((current) => (current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]))
  }

  function selectPage() {
    setSelectedQuestionIds(visibleQuestions.map((question) => question.id))
  }

  function selectAllFiltered() {
    setSelectedQuestionIds(visibleQuestions.map((question) => question.id))
  }

  async function handleBulkArchive() {
    if (!selectedQuestionIds.length) return
    setIsProcessing(true)
    const result = await bulkArchiveQuestions(selectedQuestionIds)
    setIsProcessing(false)
    setQuestions((current) => current.map((question) => (selectedQuestionIds.includes(question.id) ? { ...question, status: 'ARCHIVED' } : question)))
    setSelectedQuestionIds([])
    setMessage(`${result.summary.successCount} question(s) archived.`)
  }

  async function handleBulkRestore() {
    if (!selectedQuestionIds.length) return
    setIsProcessing(true)
    const result = await bulkRestoreQuestions(selectedQuestionIds)
    setIsProcessing(false)
    setQuestions((current) => current.map((question) => (selectedQuestionIds.includes(question.id) ? { ...question, status: 'DRAFT' } : question)))
    setSelectedQuestionIds([])
    setMessage(`${result.summary.successCount} question(s) restored.`)
  }

  async function handleBulkPublish() {
    if (!selectedQuestionIds.length) return
    setIsProcessing(true)
    const result = await bulkPublishQuestions(selectedQuestionIds)
    setIsProcessing(false)
    setQuestions((current) => current.map((question) => (selectedQuestionIds.includes(question.id) ? { ...question, status: 'PUBLISHED' } : question)))
    setSelectedQuestionIds([])
    setMessage(`${result.summary.successCount} question(s) published.`)
  }

  async function handleBulkUnpublish() {
    if (!selectedQuestionIds.length) return
    setIsProcessing(true)
    const result = await bulkUnpublishQuestions(selectedQuestionIds)
    setIsProcessing(false)
    setQuestions((current) => current.map((question) => (selectedQuestionIds.includes(question.id) ? { ...question, status: 'DRAFT' } : question)))
    setSelectedQuestionIds([])
    setMessage(`${result.summary.successCount} question(s) unpublished.`)
  }

  async function handleBulkModuleChange() {
    if (!selectedQuestionIds.length) return
    setIsProcessing(true)
    const result = await bulkUpdateQuestionModule(selectedQuestionIds, bulkModuleId)
    setIsProcessing(false)
    setQuestions((current) => current.map((question) => (selectedQuestionIds.includes(question.id) ? { ...question, questionBankId: bulkModuleId } : question)))
    setSelectedQuestionIds([])
    setMessage(`${result.summary.successCount} question(s) moved.`)
  }

  async function handleBulkDifficultyChange() {
    if (!selectedQuestionIds.length) return
    setIsProcessing(true)
    const result = await bulkUpdateQuestionDifficulty(selectedQuestionIds, bulkDifficulty)
    setIsProcessing(false)
    setQuestions((current) => current.map((question) => (selectedQuestionIds.includes(question.id) ? { ...question, difficulty: bulkDifficulty } : question)))
    setSelectedQuestionIds([])
    setMessage(`${result.summary.successCount} question(s) updated.`)
  }

  async function handleBulkTagsChange() {
    if (!selectedQuestionIds.length) return
    const tags = bulkTags.split(',').map((tag) => tag.trim()).filter(Boolean)
    setIsProcessing(true)
    const result = await bulkUpdateQuestionTags(selectedQuestionIds, tags)
    setIsProcessing(false)
    setSelectedQuestionIds([])
    setMessage(`${result.summary.successCount} question(s) tagged.`)
  }

  async function handleImport() {
    if (!importContent.trim()) return
    setIsProcessing(true)
    const result = await importQuestions({ questionBankId: questionBankId || questionBanks[0]?.id || '', content: importContent })
    setIsProcessing(false)
    setImportSummary(result.summary)
    setIsImportOpen(false)
    setImportContent('')
    setMessage(`${result.summary.successCount} question(s) imported.`)
  }

  async function handleExport() {
    setIsProcessing(true)
    const csv = await exportQuestions({
      search,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      difficulty: difficultyFilter === 'ALL' ? undefined : difficultyFilter,
      module: moduleFilter === 'ALL' ? undefined : moduleFilter,
    })
    setIsProcessing(false)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'questions.csv'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Questions exported to CSV.')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Question directory</h2>
              <p className="mt-1 text-sm text-slate-600">Search questions, filter by bank and difficulty, and open a question for editing.</p>
            </div>
            <div className="text-sm text-slate-600">{initialTotal} total</div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="ALL">All banks</option>
              {questionBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>{bank.title}</option>
              ))}
            </select>
            <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="ALL">All difficulties</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="ALL">All status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="newest">Newest</option>
              <option value="updated">Last updated</option>
            </select>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedQuestionIds([selectedQuestionId].filter(Boolean) as string[])} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Select one</button>
              <button type="button" onClick={() => selectPage()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Select page</button>
              <button type="button" onClick={() => selectAllFiltered()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Select all filtered</button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{selectedQuestionIds.length} selected</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void handleBulkArchive()} className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Archive selected</button>
                <button type="button" onClick={() => void handleBulkRestore()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Restore selected</button>
                <button type="button" onClick={() => void handleBulkPublish()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Publish selected</button>
                <button type="button" onClick={() => void handleBulkUnpublish()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Unpublish selected</button>
                <button type="button" onClick={() => setIsImportOpen(true)} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Import CSV</button>
                <button type="button" onClick={() => void handleExport()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Export CSV</button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={bulkModuleId} onChange={(event) => setBulkModuleId(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                {questionBanks.map((bank) => <option key={bank.id} value={bank.id}>{bank.title}</option>)}
              </select>
              <button type="button" onClick={() => void handleBulkModuleChange()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Change module</button>
              <select value={bulkDifficulty} onChange={(event) => setBulkDifficulty(event.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
              <button type="button" onClick={() => void handleBulkDifficultyChange()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Change difficulty</button>
              <input value={bulkTags} onChange={(event) => setBulkTags(event.target.value)} placeholder="tag-a, tag-b" className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              <button type="button" onClick={() => void handleBulkTagsChange()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Update tags</button>
            </div>
          </div>

          {isProcessing ? <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">Processing requested bulk operation…</div> : null}
          {message ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

          {isImportOpen ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Import CSV</p>
              <p className="mt-1 text-sm text-slate-600">Paste CSV rows with question, options, correct_answer, explanation, difficulty, module, status.</p>
              <textarea value={importContent} onChange={(event) => setImportContent(event.target.value)} className="mt-3 min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="question,option_a|option_b,correct_answer,explanation,BEGINNER,Airframes,DRAFT" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void handleImport()} className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Run import</button>
                <button type="button" onClick={() => setIsImportOpen(false)} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              </div>
            </div>
          ) : null}

          {importSummary ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Import summary</p>
              <p className="mt-1">Imported {importSummary.successCount}, failed {importSummary.failureCount}.</p>
              {importSummary.validationErrors.length ? <p className="mt-2 text-rose-600">{importSummary.validationErrors.join(' • ')}</p> : null}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={selectedQuestionIds.length > 0 && selectedQuestionIds.length === visibleQuestions.length} onChange={() => (selectedQuestionIds.length === visibleQuestions.length ? setSelectedQuestionIds([]) : selectPage())} />
                  </th>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3">Bank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {visibleQuestions.map((question) => (
                  <tr key={question.id} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3" onClick={() => toggleSelection(question.id)}>
                      <input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={() => toggleSelection(question.id)} />
                    </td>
                    <td className="px-4 py-3" onClick={() => void handleSelectQuestion(question.id)}>
                      <p className="font-medium text-slate-900">{question.question}</p>
                      <p className="mt-1 text-xs text-slate-500">{question.correctAnswer ?? 'No answer set'}</p>
                    </td>
                    <td className="px-4 py-3" onClick={() => void handleSelectQuestion(question.id)}>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${question.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : question.status === 'ARCHIVED' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>{question.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600" onClick={() => void handleSelectQuestion(question.id)}>{question.difficulty}</td>
                    <td className="px-4 py-3 text-slate-600" onClick={() => void handleSelectQuestion(question.id)}>{question.questionBankId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{selectedQuestion ? 'Edit question' : 'Create question'}</h2>
              <p className="mt-1 text-sm text-slate-600">Question preview, validation, and archive controls stay within the admin workspace.</p>
            </div>
            {selectedQuestion ? (
              <button type="button" onClick={() => void handleArchive()} className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Archive</button>
            ) : null}
          </div>

          {errors.length ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errors.join(' • ')}</div> : null}

          <form className="mt-6 space-y-4" onSubmit={(event) => void handleSave(event)}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Question</label>
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Question bank</label>
                <select value={questionBankId} onChange={(event) => setQuestionBankId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  {questionBanks.map((bank) => <option key={bank.id} value={bank.id}>{bank.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Difficulty</label>
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Options</label>
              <div className="mt-2 space-y-2">
                {options.map((option, index) => (
                  <div key={`${index}-${option}`} className="flex items-center gap-2">
                    <input value={option} onChange={(event) => {
                      const next = [...options]
                      next[index] = event.target.value
                      setOptions(next)
                    }} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                    <button type="button" onClick={() => setCorrectOptionIndex(index)} className={`rounded-full px-3 py-2 text-sm ${correctOptionIndex === index ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Correct</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Explanation</label>
              <textarea value={explanation} onChange={(event) => setExplanation(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Preview</p>
              <p className="mt-2 text-sm text-slate-700">{prompt || 'Your question preview appears here.'}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {options.filter(Boolean).map((option, index) => <li key={`${option}-${index}`}>{option}</li>)}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save question</button>
              <button type="button" onClick={() => resetForm()} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Reset</button>
              <button type="button" onClick={() => { if (selectedQuestion?.id) void submitForReviewAction('QUESTION', selectedQuestion.id) }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Submit for review</button>
              <button type="button" onClick={() => { if (selectedQuestion?.id) void approvePublishingAction('QUESTION', selectedQuestion.id) }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Approve</button>
              <button type="button" onClick={() => { if (selectedQuestion?.id) void rejectPublishingAction('QUESTION', selectedQuestion.id, 'Needs revision') }} className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700">Reject</button>
              <button type="button" onClick={() => { if (selectedQuestion?.id) void publishContentAction('QUESTION', selectedQuestion.id) }} className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700">Publish</button>
              <button type="button" onClick={() => { if (selectedQuestion?.id) void unpublishContentAction('QUESTION', selectedQuestion.id) }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Unpublish</button>
              <button type="button" onClick={() => { if (selectedQuestion?.id) void archiveContentAction('QUESTION', selectedQuestion.id) }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Archive</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
