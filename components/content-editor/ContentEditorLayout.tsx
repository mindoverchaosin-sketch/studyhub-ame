'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import LogoutButton from '@/components/dashboard/LogoutButton'
import { FaBook, FaFileLines, FaFilePdf, FaClipboardList, FaQuestion } from 'react-icons/fa6'

interface NavItem {
  href: string
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { href: '/content-editor/modules', label: 'Modules', icon: <FaBook className="h-5 w-5" /> },
  { href: '/content-editor/lessons', label: 'Lessons', icon: <FaFileLines className="h-5 w-5" /> },
  { href: '/content-editor/materials', label: 'Study Materials', icon: <FaFilePdf className="h-5 w-5" /> },
  { href: '/content-editor/previous-papers', label: 'Previous Papers', icon: <FaFilePdf className="h-5 w-5" /> },
  { href: '/content-editor/mock-tests', label: 'Mock Tests', icon: <FaClipboardList className="h-5 w-5" /> },
  { href: '/content-editor/questions', label: 'Questions', icon: <FaQuestion className="h-5 w-5" /> },
]

export default function ContentEditorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#fef8f0_0%,_#fef5f0_100%)] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row lg:gap-6 lg:px-6 lg:py-6">
        {/* Sidebar */}
        <aside className="w-full lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-72">
          <div className="flex h-full flex-col rounded-[2rem] border border-amber-200 bg-amber-950 p-5 text-amber-100 shadow-[0_25px_80px_rgba(120,53,15,0.16)]">
            {/* Logo */}
            <Link href="/content-editor/dashboard" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-amber-300">
                <FaBook className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Content Editor</p>
                <p className="text-base text-white">StudyHub CMS</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="mt-8 space-y-1" aria-label="Content editor navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-amber-600 text-white'
                        : 'text-amber-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-amber-200">
              <p className="font-semibold text-white">Create & Publish</p>
              <p className="mt-2 leading-6">Manage courses, modules, lessons, materials, and mock tests from one unified workspace.</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 px-4 py-4 sm:px-6 lg:px-0 lg:py-0">
          {/* Top Bar */}
          <div className="mb-4 flex items-center justify-between rounded-[2rem] border border-amber-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
            <h1 className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Editorial Console</h1>
            <LogoutButton />
          </div>

          {/* Main Area */}
          <main className="rounded-[2rem] border border-amber-200 bg-white/80 p-4 shadow-[0_20px_70px_rgba(120,53,15,0.08)] backdrop-blur sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
