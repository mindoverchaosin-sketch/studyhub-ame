import Link from "next/link";
import { FiClock, FiTrendingUp, FiZap } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { MockTestTemplate } from "@/lib/mock/exams";

type MockTestCardProps = {
  testItem: MockTestTemplate;
};

export default function MockTestCard({ testItem }: MockTestCardProps) {
  const actionLabel = testItem.status === "COMPLETED" ? "Review" : testItem.status === "IN_PROGRESS" ? "Resume" : "Start";

  return (
    <Card className="flex h-full flex-col justify-between gap-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{testItem.examType}</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{testItem.title}</h3>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{testItem.difficulty}</span>
        </div>
        <p className="text-sm leading-8 text-slate-600">{testItem.description}</p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{testItem.questionCount} Qs</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{testItem.durationMinutes} min</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Pass {testItem.passingScore}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiClock className="h-4 w-4" />{testItem.attempts}</div>
            <p className="mt-1 text-xs text-slate-500">Attempts</p>
          </div>
          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiTrendingUp className="h-4 w-4" />{testItem.bestScore}%</div>
            <p className="mt-1 text-xs text-slate-500">Best score</p>
          </div>
          <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiZap className="h-4 w-4" />{testItem.lastAttempted}</div>
            <p className="mt-1 text-xs text-slate-500">Last attempt</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">Topics: {testItem.topicCoverage.join(" · ")}</p>
          <Button asChild variant="primary" size="sm">
            <Link href={`/student/mock-exams/${testItem.id}/start`}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
