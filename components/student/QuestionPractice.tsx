'use client'

import { useState, useTransition } from 'react'
import { saveQuestionAnswer } from '@/server/actions/question-bank.actions'
import type { StudentQuestionPracticeDTO } from '@/server/services/student-question-bank.service'

export default function QuestionPractice({ question }: { question: StudentQuestionPracticeDTO }) {
  const [selectedOption, setSelectedOption] = useState(question.selectedOption)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const chooseOption = (option: number) => {
    const nextOption = selectedOption === option ? null : option
    setError(null)
    setSelectedOption(nextOption)
    startTransition(async () => {
      try {
        await saveQuestionAnswer(question.id, nextOption)
      } catch {
        setSelectedOption(selectedOption)
        setError('Unable to save your answer.')
      }
    })
  }

  return (
    <div>
      <h2 className="text-lg font-semibold leading-7 text-slate-950">{question.question}</h2>
      <div className="mt-5 space-y-3">
        {question.options.map((option, index) => <button key={option.id} type="button" disabled={isPending} onClick={() => chooseOption(index)} className={`block w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${selectedOption === index ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}>{option.text}</button>)}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>{selectedOption === null ? 'Unanswered' : 'Answer saved'}</span>
        {selectedOption !== null ? <button type="button" disabled={isPending} onClick={() => chooseOption(selectedOption)} className="font-semibold text-blue-700 hover:text-blue-900">Clear answer</button> : null}
      </div>
      {question.explanation && selectedOption !== null ? <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">{question.explanation}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-600" role="alert">{error}</p> : null}
    </div>
  )
}
