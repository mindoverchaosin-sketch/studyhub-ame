import Link from 'next/link'
import { FiArrowRight, FiBookOpen, FiLock, FiMessageSquare, FiTarget } from 'react-icons/fi'
import { entitlementService } from '@/server/domains/billing/entitlements/entitlement.service'
import { listStudentExamTemplates } from '@/server/actions/exam.actions'
import { getAllCourses } from '@/server/services/course.service'
import { getModulesByCourse } from '@/server/services/module.service'
import { getStudentQuestionBanks } from '@/server/services/student-question-bank.service'
import type { ExamTemplateDTO } from '@/server/application/dto/exam-template.dto'

type Props = { userId: string }

export default async function StudentContentOverview({ userId }: Props) {
  const [courses, questionBanks, templates, hasPremiumModules, canUseAITutor] = await Promise.all([
    getAllCourses(),
    getStudentQuestionBanks(userId),
    listStudentExamTemplates({ pageSize: 100 }) as Promise<ExamTemplateDTO[]>,
    entitlementService.canAccessPremiumModules(userId),
    entitlementService.canUseAITutor(userId),
  ])

  const modules = (await Promise.all(courses.map((course) => getModulesByCourse(course.id)))).flat()
  const freeCourses = courses.filter((course) => !course.isPremium).length
  const premiumCourses = courses.filter((course) => course.isPremium).length
  const freeModules = modules.filter((module) => !module.isPremium).length
  const premiumModules = modules.filter((module) => module.isPremium).length
  const freeBanks = questionBanks.filter((bank) => !bank.isPremium).length
  const premiumBanks = questionBanks.filter((bank) => bank.isPremium).length
  const freeMocks = templates.filter((template) => !template.isPremium).length
  const premiumMocks = templates.filter((template) => template.isPremium).length

  const freeItems = [
    { label: 'Free Courses', value: freeCourses, href: '/student/courses', icon: FiBookOpen },
    { label: 'Free Modules', value: freeModules, href: '/student/modules', icon: FiBookOpen },
    { label: 'Free Study Materials', value: 'View', href: '/student/modules', icon: FiBookOpen },
    { label: 'Free Mock Tests', value: freeMocks, href: '/student/mock-exams', icon: FiTarget },
    { label: 'Free Question Banks', value: freeBanks, href: '/student/question-bank', icon: FiBookOpen },
    { label: 'Free Quizzes', value: 'Module access', href: '/student/modules', icon: FiTarget },
  ]

  const premiumItems = [
    { label: 'Premium Courses', value: premiumCourses, href: '/student/courses', icon: FiBookOpen },
    { label: 'Premium Modules', value: premiumModules, href: '/student/modules', icon: FiBookOpen },
    { label: 'Premium Study Materials', value: hasPremiumModules ? 'Available' : 'Locked', href: hasPremiumModules ? '/student/modules' : '/student/dashboard/billing', icon: FiBookOpen },
    { label: 'Premium Mock Tests', value: premiumMocks, href: '/student/mock-exams', icon: FiTarget },
    { label: 'Premium Question Banks', value: premiumBanks, href: '/student/question-bank', icon: FiBookOpen },
    { label: 'Premium Quizzes', value: hasPremiumModules ? 'Available' : 'Locked', href: hasPremiumModules ? '/student/modules' : '/student/dashboard/billing', icon: FiTarget },
  ]

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
      <ContentGroup title="Free / Normal" tone="emerald" items={freeItems} />
      <ContentGroup title="Premium" tone="amber" items={premiumItems} locked={!hasPremiumModules} />
      <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 p-6">
        <div className="flex items-center gap-3 text-blue-700">
          <FiMessageSquare className="h-5 w-5" />
          <p className="text-sm font-semibold uppercase tracking-[0.24em]">AI Tutor</p>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-950">{canUseAITutor ? 'Ready for guided revision' : 'Premium guidance'}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{canUseAITutor ? 'Ask for explanations, study plans, and practice questions.' : 'Upgrade to unlock AI Tutor conversations and personalized guidance.'}</p>
        <Link href={canUseAITutor ? '/student/ai-tutor' : '/student/dashboard/billing'} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
          {canUseAITutor ? 'Open AI Tutor' : 'View upgrade options'} <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function ContentGroup({ title, tone, items, locked = false }: { title: string; tone: 'emerald' | 'amber'; items: Array<{ label: string; value: number | string; href: string; icon: typeof FiBookOpen }>; locked?: boolean }) {
  const palette = tone === 'emerald' ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'
  return (
    <div className={`rounded-[1.5rem] border p-6 ${palette}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">{title}</p>
        {locked ? <FiLock className="h-4 w-4 text-amber-700" /> : null}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-2xl border border-white/80 bg-white/80 p-3 transition hover:bg-white">
            <div className="flex items-center justify-between gap-2"><Icon className="h-4 w-4 text-slate-500" /><span className="text-xs font-semibold text-slate-500">{value}</span></div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}