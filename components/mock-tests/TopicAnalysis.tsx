import Card from "@/components/ui/Card";

type TopicAnalysisProps = {
  breakdown: Array<{ topic: string; accuracy: number }>;
};

export default function TopicAnalysis({ breakdown }: TopicAnalysisProps) {
  return (
    <Card>
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Topic Breakdown</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">Performance by topic</h3>
      </div>

      <div className="mt-4 space-y-3">
        {breakdown.map((b) => (
          <div key={b.topic} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{b.topic}</p>
            </div>
            <div className="w-1/2">
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${b.accuracy}%` }} />
              </div>
            </div>
            <div className="w-16 text-right text-sm font-semibold text-slate-900">{b.accuracy}%</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
