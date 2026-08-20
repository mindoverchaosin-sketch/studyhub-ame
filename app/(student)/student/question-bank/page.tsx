import { requireStudent } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiBookmark, FiBookOpen, FiFilter, FiSearch, FiTarget } from "react-icons/fi";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getStudentQuestionBanks } from "@/server/services/student-question-bank.service";

const filters = [
  { label: "All standards", value: "All" },
  { label: "DGCA", value: "DGCA" },
  { label: "EASA", value: "EASA" },
];

const difficultyOptions = ["All", "Easy", "Medium", "Hard"] as const;
const statusOptions = ["All", "Answered", "Unanswered"] as const;

export default async function QuestionBankPage() {
  let sessionUser;

  try {
    sessionUser = await requireStudent();
  } catch {
    redirect("/login");
  }

  const questionBanks = await getStudentQuestionBanks(sessionUser.user.id);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.06),_transparent_28%),#f8fafc] px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Question Bank</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Search, filter, and practice with confidence.</p>
            </div>
            <Link href="/student/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              <FiArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Link>
          </div>
        </div>
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Question bank</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Search, filter, and practice with confidence</h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">Use the intelligent bank to focus on weak areas, bookmark essentials, and keep your practice aligned with DGCA and EASA objectives.</p>
            </div>
            <Button asChild variant="primary" size="md">
              <Link href="/student/ai-tutor">Open AI Tutor</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
              <FiFilter className="h-4 w-4" />
              Filters
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Search
                <div className="mt-2 flex items-center gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3">
                  <FiSearch className="h-4 w-4 text-slate-400" />
                  <input className="w-full bg-transparent text-sm outline-none" placeholder="Search by topic or question" />
                </div>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Standard
                <select className="mt-2 w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none">
                  {filters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Difficulty
                <select className="mt-2 w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none">
                  {difficultyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select className="mt-2 w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none">
                  {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
          </Card>

          <div className="space-y-6">
            {questionBanks.map((bank) => (
              <Card key={bank.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${bank.isPremium ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{bank.isPremium ? "Premium" : "Free"}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">{bank.status}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-950">{bank.title}</h2>
                    <p className="text-sm leading-7 text-slate-600">{bank.description || "Published practice questions for focused revision."}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="rounded-full bg-slate-50 px-3 py-2">Questions: {bank.questionCount}</span>
                      <span className="rounded-full bg-slate-50 px-3 py-2">{bank.locked ? "Upgrade required" : "Available to practice"}</span>
                    </div>
                    {bank.locked ? <p className="rounded-[1.1rem] border border-amber-200 bg-amber-50 p-3 text-sm leading-7 text-amber-800">Premium access is required to open these questions. <Link href="/student/dashboard/billing" className="font-semibold underline">Upgrade</Link></p> : null}
                    {!bank.locked && bank.questions.length > 0 ? (
                      <div className="space-y-3">
                        {bank.questions.map((question) => (
                          <div key={question.id} className="rounded-[1.1rem] border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-sm font-semibold text-slate-950">{question.question}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button type="button" variant="secondary" size="sm" className="gap-2"><FiBookmark className="h-4 w-4" />Bookmark</Button>
                              <Button type="button" variant="primary" size="sm" className="gap-2"><FiTarget className="h-4 w-4" />Practice</Button>
                              <Button asChild variant="ghost" size="sm" className="gap-2"><Link href="/student/ai-tutor"><FiBookOpen className="h-4 w-4" />Explain</Link></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                    <span className="rounded-full bg-slate-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{bank.questions.length} loaded</span>
                    <Button type="button" variant={bank.locked ? "secondary" : "primary"} size="sm" className="gap-2" disabled={bank.locked}>
                      <FiTarget className="h-4 w-4" />
                      {bank.locked ? "Locked" : "Practice"}
                    </Button>
                    <Button asChild variant="ghost" size="sm" className="gap-2">
                      <Link href="/student/ai-tutor">
                        <FiBookOpen className="h-4 w-4" />
                        Explain
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {questionBanks.length === 0 ? <Card className="p-6 text-sm text-slate-600">No published question banks are available yet.</Card> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
