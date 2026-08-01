import Card from "@/components/ui/Card";

type ResultSummaryProps = {
  score: number;
  percentage: number;
  passed: boolean;
  timeTaken: string;
};

export default function ResultSummary({ score, percentage, passed, timeTaken }: ResultSummaryProps) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Score summary</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">{passed ? 'Passed' : 'Result'}</h3>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {passed ? 'Pass' : 'Needs review'}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-500">Total score</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{score}</p>
        </div>
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-500">Percentage</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{percentage}%</p>
        </div>
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-500">Time taken</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{timeTaken}</p>
        </div>
      </div>
    </Card>
  );
}
