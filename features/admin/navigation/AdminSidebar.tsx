"use client"

import { useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { FiBarChart2, FiBookOpen, FiChevronDown, FiFileText, FiGrid, FiHelpCircle, FiLayers, FiPackage, FiSettings, FiShoppingCart, FiUsers } from "react-icons/fi"
import AdminNavItem from "@/features/admin/navigation/AdminNavItem"

type AdminNavGroup = {
  label: string
  defaultOpen: boolean
  items: Array<{ href: string; label: string; icon: ReactNode }>
}

const navGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    defaultOpen: true,
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: <FiGrid className="h-5 w-5" /> }],
  },
  {
    label: "Learning Content",
    defaultOpen: true,
    items: [
      { href: "/admin/courses", label: "Courses", icon: <FiLayers className="h-5 w-5" /> },
      { href: "/admin/modules", label: "Modules", icon: <FiBookOpen className="h-5 w-5" /> },
      { href: "/admin/lessons", label: "Lessons", icon: <FiFileText className="h-5 w-5" /> },
      { href: "/admin/materials", label: "Study Materials", icon: <FiFileText className="h-5 w-5" /> },
    ],
  },
  {
    label: "Assessment",
    defaultOpen: true,
    items: [
      { href: "/admin/questions", label: "Questions", icon: <FiHelpCircle className="h-5 w-5" /> },
      { href: "/admin/quizzes", label: "Quizzes", icon: <FiBookOpen className="h-5 w-5" /> },
      { href: "/admin/mock-tests", label: "Mock Tests", icon: <FiPackage className="h-5 w-5" /> },
    ],
  },
  {
    label: "Users",
    defaultOpen: true,
    items: [
      { href: "/admin/students", label: "Students", icon: <FiUsers className="h-5 w-5" /> },
      { href: "/admin/users", label: "Users", icon: <FiUsers className="h-5 w-5" /> },
    ],
  },
  {
    label: "Commerce",
    defaultOpen: false,
    items: [
      { href: "/admin/products", label: "Products", icon: <FiPackage className="h-5 w-5" /> },
      { href: "/admin/orders", label: "Orders", icon: <FiShoppingCart className="h-5 w-5" /> },
      { href: "/admin/billing", label: "Billing", icon: <FiFileText className="h-5 w-5" /> },
    ],
  },
  {
    label: "System",
    defaultOpen: false,
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: <FiBarChart2 className="h-5 w-5" /> },
      { href: "/admin/settings", label: "Settings", icon: <FiSettings className="h-5 w-5" /> },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(navGroups.map((group) => [group.label, group.defaultOpen])),
  )

  return (
    <aside className="sticky top-0 hidden h-[calc(100vh-3rem)] min-h-[720px] w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 lg:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Control Center</h2>
      </div>
      <nav aria-label="Admin navigation">
        <div className="space-y-5">
          {navGroups.map((group) => {
            const hasActiveItem = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
            const isExpanded = expandedGroups[group.label] || hasActiveItem

            return (
              <section key={group.label} aria-labelledby={`admin-nav-${group.label.toLowerCase().replaceAll(" ", "-")}`}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:text-slate-700"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedGroups((current) => ({ ...current, [group.label]: !isExpanded }))}
                >
                  <span id={`admin-nav-${group.label.toLowerCase().replaceAll(" ", "-")}`}>{group.label}</span>
                  <FiChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {isExpanded ? (
                  <ul className="mt-2 space-y-1">
                    {group.items.map((item) => (
                      <AdminNavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
                    ))}
                  </ul>
                ) : null}
              </section>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
