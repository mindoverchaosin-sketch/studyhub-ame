import Link from "next/link";
import { FiBell, FiChevronDown, FiSearch } from "react-icons/fi";

export default function AdminNavbar() {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.04)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Operations</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950">Content administration</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <FiSearch className="h-4 w-4" />
          <input
            aria-label="Search admin content"
            className="w-full bg-transparent outline-none placeholder:text-slate-400 sm:w-48"
            placeholder="Search"
          />
        </label>

        <button className="flex items-center justify-center rounded-full border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-950" aria-label="Notifications">
          <FiBell className="h-4 w-4" />
        </button>

        <Link href="/admin/settings" className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">AD</div>
          <span>Admin Dev</span>
          <FiChevronDown className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
