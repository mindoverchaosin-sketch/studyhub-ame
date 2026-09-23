import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import PageHeader from '@/components/admin/PageHeader'
import PreviousOfficialPaperManager from '@/components/admin/PreviousOfficialPaperManager'
import { courseRepository } from '@/server/repositories/course.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { previousOfficialPaperService } from '@/server/services/previous-official-paper.service'

export default async function PreviousPapersAdminPage() {
  try {
    await requirePermission('manageResources')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  const [papers, courses, modules] = await Promise.all([
    previousOfficialPaperService.listForAdmin(),
    courseRepository.findAll(),
    moduleRepository.findAll(),
  ])

  return (
    <>
      <PageHeader title="Previous official papers" description="Manage published and archived official exam paper references." />
      <PreviousOfficialPaperManager
        papers={papers}
        courses={courses.map((course) => ({ id: course.id, title: course.title }))}
        modules={modules.map((module) => ({ id: module.id, title: module.title, courseId: module.courseId }))}
      />
    </>
  )
}
