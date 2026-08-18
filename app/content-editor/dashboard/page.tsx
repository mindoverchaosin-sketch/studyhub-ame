import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireApprovedRole } from '@/auth'
import LogoutButton from '@/components/dashboard/LogoutButton'
import { FaBook, FaFileLines, FaFilePdf, FaClipboardList, FaQuestion } from 'react-icons/fa6'

interface NavCard {
  href: string
  label: string
  description: string
  icon: React.ReactNode
}

const navCards: NavCard[] = [
  {
    href: '/content-editor/modules',
    label: 'Modules',
    description: 'Create and manage training modules',
    icon: <FaBook className="h-6 w-6" />,
  },
  {
    href: '/content-editor/lessons',
    label: 'Lessons',
    description: 'Create individual lessons within modules',
    icon: <FaFileLines className="h-6 w-6" />,
  },
  {
    href: '/content-editor/materials',
    label: 'Study Materials',
    description: 'Manage PDFs and educational resources',
    icon: <FaFilePdf className="h-6 w-6" />,
  },
  {
    href: '/content-editor/mock-tests',
    label: 'Mock Tests',
    description: 'Create and manage mock test scenarios',
    icon: <FaClipboardList className="h-6 w-6" />,
  },
  {
    href: '/content-editor/questions',
    label: 'Questions',
    description: 'Manage question banks and questions',
    icon: <FaQuestion className="h-6 w-6" />,
  },
]

export default async function ContentEditorDashboardPage() {
  try {
    const session = await requireApprovedRole('CONTENT_EDITOR')

    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,_#fef8f0_0%,_#fef5f0_100%)] px-6 py-10">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-amber-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-amber-200 pb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
                Content editor workspace
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">
                {session.user.name ?? 'Content Editor'}
              </h1>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {navCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-[1.5rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition hover:shadow-md hover:border-amber-300"
              >
                <div className="mb-3 text-amber-600 group-hover:text-amber-700">
                  {card.icon}
                </div>
                <h3 className="font-semibold text-slate-950 group-hover:text-amber-900">
                  {card.label}
                </h3>
                <p className="mt-2 text-sm text-slate-600 group-hover:text-slate-700">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">Editorial Console</p>
            <p className="mt-2">
              Your content management workspace is fully set up. Use the navigation above to create and manage modules,
              lessons, study materials, mock tests, and questions.
            </p>
          </div>
        </div>
      </main>
    )
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }
}
