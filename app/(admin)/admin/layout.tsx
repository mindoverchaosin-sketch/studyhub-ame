import type { ReactNode } from "react"
import AdminSidebar from "@/features/admin/navigation/AdminSidebar"
import AdminTopbar from "@/features/admin/navigation/AdminTopbar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <AdminTopbar />
      <div className="lg:flex lg:items-start">
        <AdminSidebar />
        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
