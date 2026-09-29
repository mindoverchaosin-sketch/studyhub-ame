import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { requireApprovedRole } from "@/auth"
import SuperAdminSidebar from "@/components/super-admin/SuperAdminSidebar"
import SuperAdminTopbar from "@/components/super-admin/SuperAdminTopbar"

export default async function SuperAdminPortalLayout({ children }: { children: ReactNode }) {
  let session
  try {
    session = await requireApprovedRole("SUPER_ADMIN")
  } catch {
    redirect("/unauthorized?reason=access-denied")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="lg:flex">
        <SuperAdminSidebar />
        <div className="min-w-0 flex-1">
          <SuperAdminTopbar name={session.user.name ?? "Super Admin"} email={session.user.email} />
          <main id="main-content" className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}