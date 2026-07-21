import type { ReactNode } from "react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Breadcrumbs from "@/components/admin/Breadcrumbs";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        <aside className="w-full lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <AdminSidebar />
        </aside>

        <div className="flex-1 px-4 py-4 sm:px-6 lg:px-0 lg:py-0">
          <AdminNavbar />
          <main className="mt-4 rounded-[2rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.04)] backdrop-blur sm:p-6 lg:p-8">
            <Breadcrumbs />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
