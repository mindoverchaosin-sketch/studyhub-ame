import { requireStudent } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import AIChatPanel from "@/components/ai/AIChatPanel";

export default async function AITutorPage() {
  let sessionUser;

  try {
    sessionUser = await requireStudent();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">AI Tutor</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Your personal exam preparation assistant for explanations, questions, and study plans.</p>
            </div>
            <Link href="/student/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              <FiArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Link>
          </div>
        </div>
        <AIChatPanel />
      </div>
    </div>
  );
}
