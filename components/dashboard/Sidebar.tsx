"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaPlane, FaCircle } from "react-icons/fa6";
import { FiBookOpen, FiCompass, FiGrid, FiSearch, FiSettings, FiHelpCircle, FiTarget, FiTrendingUp } from "react-icons/fi";
import LogoutButton from "@/components/dashboard/LogoutButton";

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/student/profile", label: "Profile", icon: FaCircle },
  { href: "/student/courses", label: "Courses", icon: FiBookOpen },
  { href: "/student/modules", label: "Modules", icon: FiCompass },
  { href: "/student/mock-exams", label: "Mock Tests", icon: FiTarget },
  { href: "/student/question-bank", label: "Question Bank", icon: FiSearch },
  { href: "/student/progress", label: "Progress", icon: FiTrendingUp },
  { href: "/student/ai-tutor", label: "AI Tutor", icon: FiSettings },
  { href: "/student/settings", label: "Settings", icon: FiSettings },
  { href: "/student/help", label: "Help & Support", icon: FiHelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col justify-between rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div>
        <Link href="/student/dashboard" className="flex items-center gap-3 text-lg font-semibold text-slate-950">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <FaPlane className="h-5 w-5" />
          </span>
          AeroPrep
        </Link>

        <nav className="mt-8 space-y-2" aria-label="Dashboard navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">Next milestone</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Your DGCA Airframes module is 82% complete and ready for revision.</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
