import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import { QuizManagementPanel } from '@/components/admin/quizzes/QuizManagementPanel'
import { moduleRepository } from '@/server/repositories/module.repository'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { quizManagementService } from '@/server/services/quiz-management.service'

export default async function ContentEditorQuizzesPage({ searchParams }: { searchParams: Promise<{ moduleId?: string }> }) {
  try {
    await requirePermission('manageModules')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  const params = await searchParams
  const [quizRows, moduleRows, bankRows] = await Promise.all([
    quizManagementService.list(),
    moduleRepository.findModulesForAdmin({ take: 1000, sortBy: 'title' }),
    questionBankRepository.findForAdmin({ status: 'ALL', take: 1000, sortBy: 'title', sortOrder: 'asc' }),
  ])
  const modules = moduleRows.filter((module) => !module.deletedAt).map((module) => ({ id: module.id, title: module.title, canonicalQuizId: module.canonicalQuizId }))
  const questionBanks = bankRows.filter((bank) => !bank.deletedAt).map((bank) => ({
    id: bank.id,
    title: bank.title,
    status: bank.status,
    questionCount: bank.questionCount,
  }))
  const moduleMap = new Map(modules.map((module) => [module.id, module.title]))
  const canonicalQuizMap = new Map(modules.map((module) => [module.id, module.canonicalQuizId]))
  const quizzes = quizRows.map((quiz) => ({
    id: quiz.id,
    moduleId: quiz.moduleId,
    moduleTitle: moduleMap.get(quiz.moduleId) ?? 'Unknown module',
    canonicalQuizId: canonicalQuizMap.get(quiz.moduleId) ?? null,
    title: quiz.title,
    description: quiz.description,
    status: quiz.status,
    passingScore: quiz.passingScore,
    timeLimitMinutes: quiz.timeLimitMinutes,
    questionBankIds: quiz.questionBanks.map((bank) => bank.id),
    questionBankTitles: quiz.questionBanks.map((bank) => bank.title),
    attemptCount: quiz._count.attempts,
    updatedAt: quiz.updatedAt.toISOString(),
  }))

  return (
    <ContentEditorLayout>
      <QuizManagementPanel
        initialQuizzes={quizzes}
        modules={modules}
        questionBanks={questionBanks}
        initialModuleId={modules.some((module) => module.id === params.moduleId) ? params.moduleId : undefined}
      />
    </ContentEditorLayout>
  )
}
