import { FiCircle, FiFlag, FiSearch } from "react-icons/fi";

import type { AttemptQuestion } from '@/types/exam'

type QuestionPaletteProps = {
  questions: AttemptQuestion[];
  currentIndex: number;
  answers: Record<string, number | null>;
  visited: Record<string, boolean>;
  reviews: Record<string, boolean>;
  onSelect: (index: number) => void;
};

const stateClassName = {
  current: "border-blue-300 bg-blue-600 text-white",
  answered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  default: "border-slate-200 bg-white text-slate-700",
};

export default function QuestionPalette({ questions, currentIndex, answers, reviews, onSelect }: QuestionPaletteProps) {
  return (
    <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Question palette</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">Jump to any question</h3>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500">
          <FiSearch className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-4">
        {questions.map((question, index) => {
          const isCurrent = index === currentIndex;
          const hasAnswer = answers[question.id] !== null && answers[question.id] !== undefined;
          const isReview = reviews[question.id];
          let state: keyof typeof stateClassName = "default";
          if (isCurrent) state = "current";
          else if (isReview) state = "review";
          else if (hasAnswer) state = "answered";
          const baseClasses = "flex h-11 items-center justify-center rounded-[1rem] border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`${baseClasses} ${stateClassName[state]}`}
              aria-label={`Go to question ${index + 1}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-2 rounded-[1.2rem] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <div className="flex items-center gap-2"><FiCircle className="h-3.5 w-3.5 text-slate-400" />Not visited</div>
        <div className="flex items-center gap-2"><FiCircle className="h-3.5 w-3.5 text-emerald-500" />Answered</div>
        <div className="flex items-center gap-2"><FiFlag className="h-3.5 w-3.5 text-amber-500" />Marked for review</div>
      </div>
    </aside>
  );
}
