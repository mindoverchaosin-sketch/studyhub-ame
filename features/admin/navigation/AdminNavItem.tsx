"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

type AdminNavItemProps = {
  href: string
  label: string
  icon: ReactNode
  disabled?: boolean
}

export default function AdminNavItem({ href, label, icon, disabled }: AdminNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <li>
      <Link
        href={disabled ? "/admin/dashboard" : href}
        className={[
          "group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition",
          isActive ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ]
      .filter(Boolean)
      .join(" ")}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-slate-200">
          {icon}
        </span>
        <span>{label}</span>
      </Link>
    </li>
  )
}
