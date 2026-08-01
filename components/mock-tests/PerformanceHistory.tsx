import Card from "@/components/ui/Card";

type PerformanceHistoryItem = {
  id: string;
  title: string;
  date: string;
  score: number;
  percentage: number;
  durationMinutes: number;
  passed: boolean;
};

type PerformanceHistoryProps = {
  history: PerformanceHistoryItem[];
};

export default function PerformanceHistory({ history }: PerformanceHistoryProps) {
  return (
    <Card>
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Exam history</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">Recent attempts</h3>
      </div>

      <div className="mt-4 space-y-3">
        {history.length === 0 ? (
          <p className="text-sm text-slate-600">No attempts yet — take your first mock to build history.</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{new Date(item.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{item.score}</p>
                <p className="text-xs text-slate-600">{item.percentage}%</p>
                <p className="text-xs text-slate-600">{item.durationMinutes}m</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
