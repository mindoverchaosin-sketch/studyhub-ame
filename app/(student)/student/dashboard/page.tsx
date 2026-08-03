import Link from "next/link";
import { redirect } from "next/navigation";
import { FiArrowRight, FiBookOpen, FiClock, FiMessageSquare, FiPlayCircle, FiTarget, FiTrendingUp } from "react-icons/fi";
import { requireStudent } from "@/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import ProgressRing from "@/components/dashboard/ProgressRing";
import { getDashboardSummaryAction, getStudentDashboardDataAction } from '@/server/actions/dashboard.actions';
import { getGoalProgressAction } from "@/server/actions/progress-insights.actions";
import { generateDailyPlanAction, getContinueLearningAction } from "@/server/actions/study-planner.actions";

const quickActions = [
  { title: "Continue Course", description: "Pick up where you left off.", href: "/student/courses", icon: FiBookOpen },
  { title: "Take Mock Test", description: "Practice under exam conditions.", href: "/student/mock-exams", icon: FiTarget },
  { title: "Ask AI Tutor", description: "Get help with weak topics.", href: "/student/adaptive-learning", icon: FiMessageSquare },
  { title: "Revision Notes", description: "Review high-impact concepts.", href: "/student/modules", icon: FiBookOpen },
  { title: "Practice Questions", description: "Sharpen your fundamentals.", href: "/student/search", icon: FiPlayCircle },
] as const;

export default async function StudentDashboardPage() {
  let sessionUser;

  try {
    sessionUser = await requireStudent();
  } catch {
    redirect("/login");
  }

  const summary = await getDashboardSummaryAction(sessionUser.user.id as string);
  const studentDashboard = await getStudentDashboardDataAction(sessionUser.user.id as string);
  const planner = await generateDailyPlanAction(sessionUser.user.id as string);
  const continueLearning = await getContinueLearningAction(sessionUser.user.id as string);
  const goals = await getGoalProgressAction(sessionUser.user.id as string);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const studyStreak = summary.currentStreak > 0 ? `${summary.currentStreak} day streak` : "Start your streak today";
  const timelineItems = [
    ...planner.revisionTasks.map((task) => ({ id: task.id, title: task.title, detail: task.detail })),
    ...planner.practiceTasks.map((task) => ({ id: task.id, title: task.title, detail: task.detail })),
    ...(planner.mockExamTask ? [{ id: planner.mockExamTask.id, title: planner.mockExamTask.title, detail: planner.mockExamTask.detail }] : []),
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.06),_transparent_28%),#f8fafc] px-3 py-3 sm:px-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex max-w-7xl gap-4 lg:gap-6">
        <div className="hidden lg:block lg:w-72">
          <DashboardSidebar />
        </div>

        <main className="flex-1 space-y-4 lg:space-y-6">
          <DashboardTopBar title="Student Dashboard" />

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_90px_-36px_rgba(15,23,42,0.24)] sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{greeting()}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Welcome back, {sessionUser.user.name ?? "Student"}</h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  You are preparing for {summary.modulesCompleted > 0 ? "your next milestone" : "your first milestone"}. Keep going with a clear study plan and steady practice.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">🔥 {studyStreak}</div>
                <Button asChild variant="primary" size="md">
                  <Link href="/student/courses">Continue learning</Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Daily reminder</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Review one weak topic, complete one practice set, and keep your streak alive.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">{planner.estimatedStudyMinutes} min planned today</div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_90px_-36px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Study snapshot</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Personal learning summary</h3>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">Generated {new Date(planner.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">Completed Modules</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{studentDashboard.progress.moduleCompletion}%</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">Quiz Score</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{studentDashboard.progress.quizScore}%</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">Daily Goal</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{studentDashboard.dailyGoal.minutesStudiedToday} min</p>
                  <p className="mt-2 text-sm text-slate-600">{studentDashboard.dailyGoal.remainingTime} remaining</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">Weekly Target</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{studentDashboard.dailyGoal.weeklyStudyGoalMinutes} min</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_90px_-36px_rgba(15,23,42,0.12)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Recent activity</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">What you did recently</h3>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {studentDashboard.recentActivity.length > 0 ? (
                  studentDashboard.recentActivity.map((item) => (
                    <div key={`${item.title}-${item.time}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{item.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No recent activity to show yet. Start a study session to populate your feed.</div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-4">
            <ProgressRing label="DGCA Progress" caption="Completed modules and steady momentum" value={summary.totalModules > 0 ? Math.round((summary.modulesCompleted / summary.totalModules) * 100) : 0} tone="blue" action={<Link href="/student/modules" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Continue <FiArrowRight className="h-4 w-4" /></Link>} />
            <ProgressRing label="EASA Progress" caption="Stay aligned with your next exam milestone" value={Math.max(0, Math.min(100, summary.readinessScore))} tone="cyan" action={<Link href="/student/modules" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">Review <FiArrowRight className="h-4 w-4" /></Link>} />
            <Card className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Mock Accuracy</p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{summary.averageMockScore}%</p>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                <FiTrendingUp className="h-4 w-4" />
                +8% vs last week
              </div>
            </Card>
            <Card className="flex flex-col justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Study Time</p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{summary.weeklyStudyMinutes}h</p>
              </div>
              <div className="text-sm text-slate-600">Goal: 8h / week</div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Continue learning</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Resume your current lesson</h3>
                </div>
                <div className="text-sm font-medium text-slate-500">{continueLearning.lastModule ?? "No module yet"}</div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{continueLearning.lastLesson ?? "Start with your first module"}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{continueLearning.lastLesson ? "Pick up from your recent progress and continue with confidence." : "Begin your first aviation lesson and build momentum."}</p>
                  </div>
                  <Button asChild variant="primary" size="md">
                    <Link href={continueLearning.resumeUrl ?? "/modules"}>Resume</Link>
                  </Button>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Progress</span>
                    <span>{continueLearning.lastMockExam ?? 42}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${Math.max(8, continueLearning.lastMockExam ?? 42)}%` }} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <FiClock className="h-4 w-4" />
                    Estimated time remaining: 25 min
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Today&apos;s goal</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Stay consistent</h3>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{goals.completionPercentage ?? 68}%</div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Questions answered</span>
                    <span>{goals.questionsCompletedToday ?? 0}/{goals.dailyQuestionGoal ?? 0}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, goals.dailyQuestionGoal ? Math.round(((goals.questionsCompletedToday ?? 0) / goals.dailyQuestionGoal) * 100) : 0)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Weekly consistency</span>
                    <span>{goals.weeklyStudyMinutesCompleted ?? 0}/{goals.weeklyStudyGoalMinutes ?? 0}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, goals.weeklyStudyGoalMinutes ? Math.round(((goals.weeklyStudyMinutesCompleted ?? 0) / goals.weeklyStudyGoalMinutes) * 100) : 0)}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">AI learning workspace</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your tutor and practice hub</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <Link href="/student/ai-tutor" className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
                  <p className="text-base font-semibold text-slate-950">Continue AI Conversation</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Reopen your latest tutor session and keep learning in context.</p>
                </Link>
                <Link href="/student/ai-tutor" className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
                  <p className="text-base font-semibold text-slate-950">Ask AI Tutor</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Get explanations, revision plans, and question sets instantly.</p>
                </Link>
                <Link href="/student/question-bank" className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
                  <p className="text-base font-semibold text-slate-950">Recommended Practice</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Practice the next best questions and keep your weak topics in focus.</p>
                </Link>
                <Link href="/student/adaptive-learning" className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
                  <p className="text-base font-semibold text-slate-950">Today&apos;s Focus</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Review a concept, retry a mock, and protect your streak.</p>
                </Link>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Quick actions</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Jump into the next step</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {quickActions.map(({ title, description, href, icon: Icon }) => (
                  <Link key={title} href={href} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{title}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Recent activity</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your study timeline</h3>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {timelineItems.length > 0 ? (
                  timelineItems.map((item, index) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
                        {index !== timelineItems.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
                      </div>
                      <div className="min-w-0 flex-1 rounded-[1.1rem] border border-slate-200 bg-slate-50/80 p-3">
                        <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-7 text-slate-600">{item.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm leading-7 text-slate-600">
                    No timeline items are available yet. Start a lesson or build a new study plan to populate your timeline.
                  </div>
                )}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Study insights</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Performance snapshot</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-500">Questions answered</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.questionsSolved}</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-500">Average score</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.averageMockScore}%</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-500">Study streak</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.currentStreak} days</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-slate-500">Weak topics</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.revisionQueueCount}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Upcoming mock tests</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Stay exam-ready</h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {planner.mockExamTask ? (
                  <div className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{planner.mockExamTask.title}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-600">{planner.mockExamTask.detail}</p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                      <Link href="/student/mock-exams">Start Test</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm leading-7 text-slate-600">
                    No mock tests scheduled yet. Keep studying and your next practice window will appear here.
                  </div>
                )}
              </div>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
