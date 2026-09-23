import { redirect } from 'next/navigation'
import { requireStudent } from '@/auth'
import ModulesPageClient from './ModulesPageClient'
import { getCourseBrowserData } from '@/features/courses/actions/course-browser'

export default async function StudentModulesPage() {
  let sessionUser

  try {
    sessionUser = await requireStudent()
  } catch {
    redirect('/login')
  }

  const { courses } = await getCourseBrowserData()

  return <ModulesPageClient courses={courses} />
}
