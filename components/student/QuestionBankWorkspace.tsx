'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { FiBookmark, FiBookOpen, FiFilter, FiSearch, FiTarget } from 'react-icons/fi'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { saveQuestionAnswer, toggleQuestionBookmark } from '@/server/actions/question-bank.actions'
import type { StudentQuestionBankDTO } from '@/server/services/student-question-bank.service'

type QuestionBankWorkspaceProps = { questionBanks: StudentQuestionBankDTO[] }
type Difficulty = 'All' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
type AnswerStatus = 'All' | 'Answered' | 'Unanswered'

export default function QuestionBankWorkspace({ questionBanks }: QuestionBankWorkspaceProps) {
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('All')
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('All')
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false)
  const [banks, setBanks] = useState(questionBanks)
  const [isPending, startTransition] = useTransition()

  const filteredBanks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return banks.map((bank) => ({
      ...bank,
      questions: bank.questions.filter((question) => {
        const matchesSearch = !normalizedSearch || question.question.toLowerCase().includes(normalizedSearch)
        const matchesDifficulty = difficulty === 'All' || question.difficulty === difficulty
        const matchesStatus = answerStatus === 'All' || (answerStatus === 'Answered' ? question.isAnswered : !question.isAnswered)
        const matchesBookmark = !bookmarkedOnly || question.isBookmarked
        return matchesSearch && matchesDifficulty && matchesStatus && matchesBookmark
      }),
    }))
  }, [answerStatus, banks, bookmarkedOnly, difficulty, search])

  const updateAnswer = (questionId: string, selectedOption: number | null) => {
    startTransition(async () => {
      const saved = await saveQuestionAnswer(questionId, selectedOption)
      setBanks((current) => current.map((bank) => ({
        ...bank,
        questions: bank.questions.map((question) => question.id === questionId
          ? { ...question, selectedOption: saved.selectedOption, answeredAt: saved.answeredAt?.toISOString() ?? null, isAnswered: saved.answeredAt !== null }
          : question),
      })))
    })
  }

  const updateBookmark = (questionId: string) => {
    startTransition(async () => {
      const result = await toggleQuestionBookmark(questionId)
      setBanks((current) => current.map((bank) => ({
        ...bank,
        questions: bank.questions.map((question) => question.id === questionId ? { ...question, isBookmarked: result.bookmarked } : question),
      })))
    })
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-blue-600"><FiFilter className="h-4 w-4" />Filters</div>
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Search
            <div className="mt-2 flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3"><FiSearch className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search by question" /></div>
          </label>
          <label className="block text-sm font-medium text-slate-700">Standard
            <select disabled className="mt-2 w-full rounded-[1rem] border border-slate-200 bg-slate-100 px-3 py-3 text-sm outline-none"><option>All standards</option></select>
            <span className="mt-2 block text-xs font-normal text-slate-500">Standard filtering is unavailable until exam-track data is added.</span>
          </label>
          <label className="block text-sm font-medium text-slate-700">Difficulty
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="mt-2 w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none">
              <option value="All">All</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">Status
            <select value={answerStatus} onChange={(event) => setAnswerStatus(event.target.value as AnswerStatus)} className="mt-2 w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"><option>All</option><option>Answered</option><option>Unanswered</option></select>
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={bookmarkedOnly} onChange={(event) => setBookmarkedOnly(event.target.checked)} />Bookmarked only</label>
        </div>
      </Card>

      <div className="space-y-6">
        {filteredBanks.map((bank) => (
          <Card key={bank.id} className="p-5 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${bank.isPremium ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{bank.isPremium ? 'Premium' : 'Free'}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{bank.status}</span></div>
              <h2 className="text-lg font-semibold text-slate-950">{bank.title}</h2>
              <p className="text-sm leading-7 text-slate-600">{bank.description || 'Published practice questions for focused revision.'}</p>
              {bank.locked ? <p className="rounded-[1.1rem] border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-800">Premium access is required to open these questions. <Link href="/student/dashboard/billing" className="font-semibold underline">Upgrade</Link></p> : null}
              {!bank.locked && bank.questions.length > 0 ? bank.questions.map((question) => (
                <div key={question.id} className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-sm font-semibold text-slate-950">{question.question}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, index) => <button key={option.id} type="button" disabled={isPending} onClick={() => updateAnswer(question.id, question.selectedOption === index ? null : index)} className={`rounded-xl border px-3 py-2 text-left text-sm transition ${question.selectedOption === index ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}>{option.text}</button>)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="secondary" size="sm" className="gap-2" disabled={isPending} onClick={() => updateBookmark(question.id)}><FiBookmark className="h-4 w-4" />{question.isBookmarked ? 'Bookmarked' : 'Bookmark'}</Button><Button asChild variant="primary" size="sm" className="gap-2"><Link href={`/student/question-bank/practice/${question.id}`}><FiTarget className="h-4 w-4" />Practice</Link></Button><Button asChild variant="ghost" size="sm" className="gap-2"><Link href="/student/ai-tutor"><FiBookOpen className="h-4 w-4" />Explain</Link></Button></div>
                </div>
              )) : null}
              {!bank.locked && bank.questions.length === 0 ? <p className="text-sm text-slate-600">No questions match the current filters.</p> : null}
            </div>
          </Card>
        ))}
        {filteredBanks.length === 0 ? <Card className="p-6 text-sm text-slate-600">No published question banks are available yet.</Card> : null}
      </div>
    </section>
  )
}
