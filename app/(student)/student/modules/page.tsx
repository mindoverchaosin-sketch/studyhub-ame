import { redirect } from 'next/navigation'
import { requireStudent } from '@/auth'
import { entitlementService } from '@/server/domains/billing/entitlements/entitlement.service'
import ModulesPageClient from './ModulesPageClient'

export default async function StudentModulesPage() {
  let sessionUser

  try {
    sessionUser = await requireStudent()
  } catch {
    redirect('/login')
  }

  const hasPremiumAccess = await entitlementService.canAccessPremiumModules(sessionUser.user.id as string)

  if (!hasPremiumAccess) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Premium access required</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950">Unlock premium modules</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">This content is available only to students with an active subscription. Upgrade your plan to continue your learning journey.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="/student/dashboard/billing" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Go to billing</a>
            <a href="/student/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Return to dashboard</a>
          </div>
        </div>
      </div>
    )
  }

  return <ModulesPageClient />
}
