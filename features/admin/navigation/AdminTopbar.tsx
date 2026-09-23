"use client"

import Link from "next/link"
import { FiBell, FiSearch } from "react-icons/fi"

export default function AdminTopbar() {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white/90 px-4 py-4 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:justify-between sm:gap-0 lg:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Admin workspace</p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/dashboard" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">Dashboard</Link>
          <Link href="/admin/courses" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">Courses</Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
          <FiSearch className="mr-2 h-4 w-4" /> Search
        </button>
        <button type="button" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
          <FiBell className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
