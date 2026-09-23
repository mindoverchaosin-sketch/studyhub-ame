import { requireStudent } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import Button from "@/components/ui/Button";
import { getStudentQuestionBanks } from "@/server/services/student-question-bank.service";
import QuestionBankWorkspace from "@/components/student/QuestionBankWorkspace";

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

        <QuestionBankWorkspace questionBanks={questionBanks} />
      </div>
    </div>
  );
}
