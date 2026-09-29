"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiActivity, FiBarChart2, FiBookOpen, FiCheckSquare, FiFileText, FiGrid, FiLayers, FiLock, FiPackage, FiUsers } from "react-icons/fi"

const groups = [
  {
    title: "Overview",
    items: [{ href: "/super-admin/dashboard", label: "Dashboard", icon: FiGrid }],
  },
  {
    title: "Administration",
    items: [
      { href: "/super-admin/approvals", label: "Admin Approvals", icon: FiCheckSquare },
      { href: "/super-admin/users", label: "Users", icon: FiUsers },
      { href: "/super-admin/roles", label: "Roles & Permissions", icon: FiLock },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/courses", label: "Courses", icon: FiLayers },
      { href: "/admin/modules", label: "Modules", icon: FiBookOpen },
      { href: "/admin/materials", label: "Study Materials", icon: FiFileText },
      { href: "/admin/questions", label: "Questions", icon: FiActivity },
      { href: "/admin/exams", label: "Exam Templates", icon: FiBookOpen },
      { href: "/super-admin/publishing", label: "Publishing", icon: FiPackage },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/admin/billing", label: "Billing", icon: FiFileText },
      { href: "/admin/billing/invoices", label: "Invoices", icon: FiFileText },
      { href: "/super-admin/revenue", label: "Revenue / Analytics", icon: FiBarChart2 },
    ],
    unavailable: ["Orders"],
  },
  {
    title: "Governance",
    items: [
      { href: "/super-admin/audit-logs", label: "Audit Logs", icon: FiActivity },
      { href: "/super-admin/audit-logs", label: "Security / Activity", icon: FiLock },
    ],
    unavailable: ["Platform Settings"],
  },
]

function NavigationLinks() {
  const pathname = usePathname()

  return (
    <nav aria-label="Super Admin navigation" className="space-y-6">
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`super-admin-nav-${group.title.toLowerCase().replaceAll(" ", "-")}`}>
          <h2 id={`super-admin-nav-${group.title.toLowerCase().replaceAll(" ", "-")}`} className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {group.title}
          </h2>
          <ul className="space-y-1">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/super-admin/dashboard" && pathname.startsWith(`${href}/`))
              return (
                <li key={`${href}-${label}`}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                </li>
              )
            })}
            {group.unavailable?.map((label) => (
              <li key={label}>
                <div aria-disabled="true" className="flex min-h-10 items-center justify-between rounded-md px-3 py-2 text-sm text-slate-400">
                  <span>{label}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Unavailable</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}

export default function SuperAdminSidebar() {
  return (
    <>
      <details className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          Open platform navigation
        </summary>
        <div className="max-h-[70vh] overflow-y-auto py-5">
          <NavigationLinks />
        </div>
      </details>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto px-4 py-6">
          <div className="mb-8 border-b border-slate-100 px-3 pb-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">AeroPrep</p>
            <h1 className="mt-2 text-lg font-semibold text-slate-950">Platform Control</h1>
          </div>
          <NavigationLinks />
        </div>
      </aside>
    </>
  )
}