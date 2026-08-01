import Link from "next/link";
import { FiBookOpen, FiClock, FiFileText, FiPlayCircle, FiTarget } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { ModuleData } from "@/lib/mock/modules";

type ModuleDetailShellProps = {
  moduleItem: ModuleData;
};

export default function ModuleDetailShell({ moduleItem }: ModuleDetailShellProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{moduleItem.examType}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{moduleItem.difficulty}</span>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Module overview</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{moduleItem.title}</h2>
            <p className="mt-3 text-sm leading-8 text-slate-600">{moduleItem.summary}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiClock className="h-4 w-4" />{moduleItem.estimatedHours}h</div>
              <p className="mt-2 text-sm text-slate-500">Estimated time</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiPlayCircle className="h-4 w-4" />{moduleItem.lessonsCount}</div>
              <p className="mt-2 text-sm text-slate-500">Lessons</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiFileText className="h-4 w-4" />{moduleItem.resourcesCount}</div>
              <p className="mt-2 text-sm text-slate-500">Resources</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">Practice exam</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">Try a mock test aligned with this module&apos;s exam style and measure your readiness.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{moduleItem.examType} exam</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{moduleItem.difficulty}</span>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <Button asChild variant="primary" size="lg">
                <Link href="/student/mock-exams">Start a mock exam</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary" size="md">
              <Link href={`/student/modules/${moduleItem.slug}/lessons/${moduleItem.lessons[0]?.slug ?? ""}`}>Continue learning</Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="#lessons">View lessons</Link>
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
            <FiTarget className="h-4 w-4" />Learning objectives
          </div>
          <ul className="space-y-3">
            {moduleItem.objectives.map((objective) => (
              <li key={objective} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{objective}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Progress tracking</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{moduleItem.progress}% complete</h2>
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{moduleItem.status}</div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${Math.max(moduleItem.progress, 8)}%` }} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Lessons completed</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{moduleItem.lessons.filter((lesson) => lesson.completed).length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Last accessed</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{moduleItem.lastStudied}</p>
            </div>
          </div>
          <Button asChild variant="secondary" size="md">
            <Link href="#lessons">Mark module as complete</Link>
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
            <FiBookOpen className="h-4 w-4" />Continue where you left off
          </div>
          <p className="text-sm leading-8 text-slate-600">Resume the next lesson in this module and keep your momentum going. The experience is ready to connect to live progress data later.</p>
          <Button asChild variant="primary" size="md">
            <Link href={`/student/modules/${moduleItem.slug}/lessons/${moduleItem.lessons.find((lesson) => !lesson.completed)?.slug ?? moduleItem.lessons[0]?.slug ?? ""}`}>Resume</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
