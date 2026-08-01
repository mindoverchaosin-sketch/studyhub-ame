import { FiClock, FiFileText, FiPlayCircle } from "react-icons/fi";
import Button from "@/components/ui/Button";

type ExamHeaderProps = {
  title: string;
  timeLeft: string;
  progressPercent: number;
  onSubmit: () => void;
};

export default function ExamHeader({ title, timeLeft, progressPercent, onSubmit }: ExamHeaderProps) {
  return (
    <header className="sticky top-0 z-30 rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Exam session</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            <span className="mr-2 inline-flex items-center gap-2"><FiClock className="h-4 w-4" />{timeLeft}</span>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            <span className="mr-2 inline-flex items-center gap-2"><FiFileText className="h-4 w-4" />{progressPercent}% complete</span>
          </div>
          <Button variant="primary" size="sm" onClick={onSubmit} type="button">
            <span className="inline-flex items-center gap-2"><FiPlayCircle className="h-4 w-4" />Submit</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
