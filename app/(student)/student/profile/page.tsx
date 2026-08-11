import { redirect } from "next/navigation";
import { requireStudent } from "@/auth";
import { getStudentAccountData } from "@/server/services/account.service";
import Card from "@/components/ui/Card";
import LogoutButton from "@/components/dashboard/LogoutButton";
import Link from "next/link";

export default async function StudentProfilePage() {
  let sessionUser;

  try {
    sessionUser = await requireStudent();
  } catch {
    redirect("/login");
  }

  const account = await getStudentAccountData(sessionUser.user.id as string);

  if (!account) {
    redirect("/login");
  }

  const assignedCourse = account.enrollments?.[0]?.course?.title ?? "No assigned course yet";
  const profileName = account.studentProfile?.fullName ?? sessionUser.user.name ?? "Student";

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Account</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Profile overview</h1>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Assigned course</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{assignedCourse}</p>
            </div>
            <div className="space-y-3">
              <Link href="/student/settings" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-slate-50">
                Settings
              </Link>
              <Link href="/student/settings#help" className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-slate-50">
                Help & Support
              </Link>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <main>
          <div className="mb-4 flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:px-6 sm:py-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student workspace</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Profile</h1>
            </div>
            <a href="/student/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              ← Back to dashboard
            </a>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student account</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{profileName}</h2>
              </div>
              <Link href="/student/settings" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
                Edit settings
              </Link>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Card className="space-y-4 p-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Contact</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{account.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Role</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{account.role?.name ?? sessionUser.user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Profile</p>
                  <p className="mt-2 text-lg text-slate-700">{account.studentProfile?.fullName ?? "Not set"}</p>
                  <p className="text-sm text-slate-500">Target exam: {account.studentProfile?.targetExam ?? "Not set"}</p>
                </div>
              </Card>

              <Card className="space-y-4 p-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Assigned course</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{assignedCourse}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Account status</p>
                  <p className="mt-2 text-lg text-slate-700">Active student</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Learning access</p>
                  <p className="mt-2 text-lg text-slate-700">{account.enrollments?.length ? `${account.enrollments.length} course enrollment(s)` : "No course enrollments yet"}</p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
