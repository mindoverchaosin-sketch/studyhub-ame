import { redirect } from "next/navigation";
import { requireStudent } from "@/auth";
import LogoutButton from "@/components/dashboard/LogoutButton";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default async function StudentSettingsPage() {
  try {
    await requireStudent();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student workspace</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Settings</h1>
            </div>
            <a href="/student/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              ← Back to dashboard
            </a>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Account settings</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Student preferences</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">Manage your account, security, notifications, and study preferences in one place.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/student/profile" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                View profile
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-950">Profile</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Your personal information, display name, and exam target will be managed here.
              </p>
              <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Profile settings</p>
                    <p className="mt-1 text-sm text-slate-600">View and update your student profile details.</p>
                  </div>
                  <Link href="/student/profile" className="text-sm font-semibold text-blue-600">Open profile</Link>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-950">Security</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Update your password and keep your account secure.</p>
              <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">Password and multi-factor authentication options will be available here.</p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-950">Notifications</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Choose how AeroPrep keeps you informed about progress and study prompts.</p>
              <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">Notification preferences will be added in a future release.</p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-950">Learning preferences</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Set your study preferences, content pace, and preparation focus.</p>
              <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">Study preferences will be configurable here soon.</p>
              </div>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-6" id="help">
              <h2 className="text-xl font-semibold text-slate-950">Help & Support</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Get support for billing, course access, or technical issues.</p>
              <div className="mt-6 space-y-4">
                <Link href="/student/settings#help" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-slate-50">
                  View support options
                </Link>
                <a href="mailto:support@aeroprep.com" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-slate-50">
                  Contact support
                </a>
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Quick links</p>
              </div>
              <nav className="space-y-3 text-sm text-slate-700">
                <Link href="/student/profile" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-200 hover:bg-white">Profile</Link>
                <Link href="/student/settings" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-200 hover:bg-white">Settings</Link>
                <Link href="/student/settings#help" className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-200 hover:bg-white">Help & Support</Link>
              </nav>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
