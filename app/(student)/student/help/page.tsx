import { requireStudent } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiHelpCircle } from "react-icons/fi";

export default async function HelpPage() {
  try {
    await requireStudent();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Help & Support</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Find answers, support resources, and contact channels for your AeroPrep account.</p>
            </div>
            <Link href="/student/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              <FiArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
                <FiHelpCircle className="h-4 w-4" />
                Support resources
              </div>
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <p>If you need help with login, course access, or exam preparation, start with our support resources below.</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Check your enrolled course details in the student dashboard.</li>
                  <li>Review the FAQ section for answers to common questions.</li>
                  <li>Contact support at <a className="font-semibold text-blue-600 hover:underline" href="mailto:support@aeroprep.com">support@aeroprep.com</a>.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Getting started</h2>
              <p className="mt-3 text-sm text-slate-600">Need quick help? Use these links to reach course materials, AI support, and account settings.</p>
              <div className="mt-5 space-y-3">
                <Link href="/student/profile" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-white">View profile</Link>
                <Link href="/student/settings" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-white">Account settings</Link>
                <Link href="/student/ai-tutor" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-white">Ask AI Tutor</Link>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-blue-600 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">Need urgent help?</p>
              <h2 className="mt-3 text-2xl font-semibold">Contact support</h2>
              <p className="mt-3 text-sm leading-7 text-blue-100">Our team is available to help with account access, course issues, and exam readiness.</p>
              <a href="mailto:support@aeroprep.com" className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-slate-100">Email support</a>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Support hours</h2>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-950">Weekdays</dt>
                  <dd>9:00 AM — 6:00 PM</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Saturday</dt>
                  <dd>10:00 AM — 2:00 PM</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-950">Sunday</dt>
                  <dd>Closed</dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
