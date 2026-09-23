import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/auth";import PageHeader from "@/components/admin/PageHeader";
import { getStudentDetailAction, reactivateStudentAction, resetStudentProgressAction, suspendStudentAction } from "@/server/actions/student-management.actions";

export default async function StudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  try {
    await requirePermission('manageStudents');
  } catch {
    redirect("/login");
  }

  const { studentId } = await params;
  const detail = await getStudentDetailAction(studentId);

  return (
    <div className="space-y-6">
        <PageHeader
          title={detail.fullName}
          description="Inspect learner profile, engagement, and operational controls."
          actions={
            <div className="flex flex-wrap gap-3">
              <form action={detail.status === "ACTIVE" ? suspendStudentAction : reactivateStudentAction}>
                <input type="hidden" name="studentId" value={studentId} />
                <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                  {detail.status === "ACTIVE" ? "Suspend account" : "Reactivate account"}
                </button>
              </form>
              <form action={resetStudentProgressAction}>
                <input type="hidden" name="studentId" value={studentId} />
                <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  Reset progress
                </button>
              </form>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Profile</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd className="mt-1 text-sm text-slate-900">{detail.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Display name</dt>
                <dd className="mt-1 text-sm text-slate-900">{detail.displayName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Target exam</dt>
                <dd className="mt-1 text-sm text-slate-900">{detail.profile.targetExam ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Status</dt>
                <dd className="mt-1 text-sm text-slate-900">{detail.status}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Activity</h3>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Registered</dt>
                <dd className="mt-1 text-sm text-slate-900">{new Date(detail.activity.registeredAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Last active</dt>
                <dd className="mt-1 text-sm text-slate-900">{new Date(detail.activity.lastActiveAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Enrolled courses", value: detail.progress.enrolledCourses },
            { label: "Completed courses", value: detail.progress.completedCourses },
            { label: "Average completion", value: `${detail.progress.averageCompletion}%` },
            { label: "Achievements", value: detail.progress.achievements },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-950">Learning footprint</h3>
            <Link href="/admin/students" className="text-sm font-semibold text-slate-700">
              Back to directory
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-500">Modules completed</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">{detail.progress.completedModules}</div>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-500">Lessons completed</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">{detail.progress.completedLessons}</div>
            </div>
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-500">Attempts</div>
              <div className="mt-2 text-xl font-semibold text-slate-950">{detail.progress.quizAttempts + detail.progress.mockExamAttempts}</div>
            </div>
          </div>
        </div>
      </div>
  );
}
