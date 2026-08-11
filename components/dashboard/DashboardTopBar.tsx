import Link from "next/link";
import { FiBell, FiSearch } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import LogoutButton from "@/components/dashboard/LogoutButton";

type DashboardTopBarProps = {
  title?: string;
  searchPlaceholder?: string;
};

export default function DashboardTopBar({ title = "Dashboard", searchPlaceholder = "Search modules, quizzes, notes" }: DashboardTopBarProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/80 px-4 py-4 shadow-[0_20px_70px_rgba(15,23,42,0.04)] backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500">
          <FiSearch className="h-4 w-4" />
          <input aria-label={searchPlaceholder} placeholder={searchPlaceholder} className="w-full bg-transparent outline-none placeholder:text-slate-400 sm:w-56" />
        </label>

        <div className="flex items-center gap-2">
          <button type="button" aria-label="View notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            <FiBell className="h-4 w-4" />
          </button>
          <Link href="/student/profile" aria-label="View profile" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            <FaUserCircle className="h-5 w-5 text-blue-600" />
            Profile
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
