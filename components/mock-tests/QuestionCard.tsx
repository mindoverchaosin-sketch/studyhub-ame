import { FiCheckCircle, FiFlag, FiStar } from "react-icons/fi";
import Button from "@/components/ui/Button";
import type { AttemptQuestion } from '@/types/exam'

type QuestionCardProps = {
  question: AttemptQuestion;
  selectedOption: number | null;
  bookmarked: boolean;
  markedForReview: boolean;
  onSelect: (index: number) => void;
  onBookmark: () => void;
  onMarkReview: () => void;
  onClear: () => void;
  isSubmitting?: boolean;
};

export default function QuestionCard({ question, selectedOption, bookmarked, markedForReview, onSelect, onBookmark, onMarkReview, onClear, isSubmitting = false }: QuestionCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Current question</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{question.question}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {question.topic ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{question.topic}</span> : null}
          {question.difficulty ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{question.difficulty}</span> : null}
          {question.type ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{question.type}</span> : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {question.options.map((option, index) => {
          const selected = selectedOption === index;
          return (
            <button key={`${question.id}-${index}`} type="button" onClick={() => onSelect(index)} disabled={isSubmitting} className={`flex w-full items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-left transition ${selected ? "border-blue-300 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${selected ? "border-blue-300 bg-blue-600 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option}</span>
              {selected ? <FiCheckCircle className="h-4 w-4" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" size="sm" onClick={onBookmark} type="button" data-testid="bookmark-button" disabled={isSubmitting}>
          <span className="inline-flex items-center gap-2"><FiStar className="h-4 w-4" />{bookmarked ? "Unbookmark" : "Bookmark"}</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={onMarkReview} type="button" data-testid="review-button" disabled={isSubmitting}>
          <span className="inline-flex items-center gap-2"><FiFlag className="h-4 w-4" />{markedForReview ? "Unmark review" : "Mark for review"}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} type="button" disabled={isSubmitting}>
          Clear answer
        </Button>
      </div>
    </section>
  );
}
