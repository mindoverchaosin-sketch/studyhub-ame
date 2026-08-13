import { redirect } from "next/navigation";
import { requireApprovedRole } from "@/auth";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default async function SuperAdminDashboardPage() {
  try {
    const session = await requireApprovedRole("SUPER_ADMIN");

    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-600">Super admin workspace</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">{session.user.name ?? "Super Admin"}</h1>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Current role</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">SUPER_ADMIN</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Workspace</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">Platform Control</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
            This protected dashboard is intentionally minimal while the full privileged platform and governance tooling are being expanded.
          </div>
        </div>
      </main>
    );
  } catch {
    redirect("/unauthorized?reason=access-denied");
  }
}
