"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBookOpen, FiCompass, FiGrid, FiMoon, FiSearch, FiSettings, FiStar, FiTarget, FiTrendingUp, FiZap } from "react-icons/fi";
import { FaPlane } from "react-icons/fa6";

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/student/courses", label: "My Courses", icon: FiBookOpen },
  { href: "/student/modules", label: "DGCA Modules", icon: FiCompass },
  { href: "/student/modules", label: "EASA Modules", icon: FiCompass },
  { href: "/student/mock-exams", label: "Mock Tests", icon: FiTarget },
  { href: "/student/search", label: "Question Bank", icon: FiSearch },
  { href: "/student/modules", label: "Revision Notes", icon: FiBookOpen },
  { href: "/student/adaptive-learning", label: "AI Tutor", icon: FiStar },
  { href: "/student/dashboard", label: "Progress", icon: FiTrendingUp },
  { href: "/student/dashboard", label: "Settings", icon: FiSettings },
] as const;

type DashboardSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export default function DashboardSidebar({ mobile = false, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={mobile ? "flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)]" : "hidden h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] lg:flex"}>
      <div>
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-slate-950" onClick={onNavigate}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <FaPlane className="h-5 w-5" />
          </span>
          AeroPrep
        </Link>

        <nav className="mt-8 space-y-1.5" aria-label="Dashboard navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href === "/student/dashboard" && pathname.startsWith("/student/dashboard"));
            return (
              <Link
                key={label}
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 rounded-[1.25rem] border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
          <FiZap className="h-4 w-4" />
          Next milestone
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-600">Your DGCA Airframes module is 82% complete and ready for revision.</p>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <FiMoon className="h-4 w-4" />
          Theme
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">Soon</span>
      </div>
    </aside>
  );
}
