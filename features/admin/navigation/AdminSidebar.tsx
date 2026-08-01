"use client"

import { FiGrid, FiLayers, FiBookOpen, FiFileText, FiHelpCircle, FiUsers, FiBarChart2, FiSettings } from "react-icons/fi"
import AdminNavItem from "@/features/admin/navigation/AdminNavItem"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <FiGrid className="h-5 w-5" /> },
  { href: "/admin/courses", label: "Courses", icon: <FiLayers className="h-5 w-5" /> },
  { href: "/admin/topics", label: "Topics", icon: <FiBookOpen className="h-5 w-5" /> },
  { href: "/admin/resources", label: "Resources", icon: <FiFileText className="h-5 w-5" /> },
  { href: "/admin/questions", label: "Questions", icon: <FiHelpCircle className="h-5 w-5" /> },
  { href: "/admin/students", label: "Students", icon: <FiUsers className="h-5 w-5" /> },
  { href: "/admin/users", label: "Users", icon: <FiUsers className="h-5 w-5" /> },
  { href: "/admin/analytics", label: "Analytics", icon: <FiBarChart2 className="h-5 w-5" /> },
  { href: "/admin/settings", label: "Settings", icon: <FiSettings className="h-5 w-5" />, disabled: true },
]

export default function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-[calc(100vh-3rem)] min-h-[720px] w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 lg:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Control Center</h2>
      </div>
      <nav aria-label="Admin navigation">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <AdminNavItem key={item.href} href={item.href} label={item.label} icon={item.icon} disabled={item.disabled} />
          ))}
        </ul>
      </nav>
    </aside>
  )
}
