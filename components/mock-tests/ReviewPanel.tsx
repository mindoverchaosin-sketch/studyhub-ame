import Card from "@/components/ui/Card";
import type { AttemptQuestion } from '@/types/exam'

type ReviewPanelProps = {
  question: AttemptQuestion;
  userAnswer: number | null;
  onPrev: () => void;
  onNext: () => void;
};

export default function ReviewPanel({ question, userAnswer, onPrev, onNext }: ReviewPanelProps) {
  const isCorrect = question.correctOption !== undefined && userAnswer === question.correctOption
  const statusLabel = userAnswer === null ? 'Unanswered' : isCorrect ? 'Correct' : 'Incorrect'

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Answer review</p>
          <p className="mt-2 text-sm text-slate-600">Review your selection and the correct solution before submitting.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onPrev} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Prev</button>
          <button onClick={onNext} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Next</button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">Status</p>
          <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${isCorrect ? 'bg-emerald-100 text-emerald-700' : userAnswer === null ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>
            {statusLabel}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">{question.question}</p>
          <div className="mt-4 space-y-3 text-sm">
            {question.options.map((opt, idx) => {
              const isUser = userAnswer === idx
              const isCorrectOption = idx === question.correctOption
              return (
                <div
                  key={`${question.id}-${idx}`}
                  className={`rounded-[1rem] border p-4 ${isCorrectOption ? 'border-emerald-200 bg-emerald-50' : isUser ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{String.fromCharCode(65 + idx)}</div>
                    <div className="flex-1">{opt}</div>
                    {isCorrectOption ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Correct</span> : isUser ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Your answer</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
          <p className="font-semibold text-slate-900">Explanation</p>
          <p className="mt-3">{question.explanation ?? 'This question is designed to test your understanding of the related topic. Review the concept and continue practicing.'}</p>
        </div>
      </div>
    </Card>
  )
}
