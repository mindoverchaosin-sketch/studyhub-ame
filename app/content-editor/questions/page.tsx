import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import PageHeader from '@/components/admin/PageHeader'
import QuestionBankDirectoryPanel from '@/components/admin/questions/QuestionBankDirectoryPanel'
import QuestionBankPanel from '@/components/admin/questions/QuestionBankPanel'
import { getAdminQuestionBanks, getAdminQuestionLibrary } from '@/server/services/question.service'
import { questionBankManagementService } from '@/server/services/question-bank-management.service'
import QuestionBankPageClient from '@/app/(admin)/admin/questions/QuestionBankPageClient'

export default async function QuestionsPage() {
  try {
    await requirePermission('manageQuestions')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  const [library, banks, qbList] = await Promise.all([
    getAdminQuestionLibrary({ page: 1, pageSize: 20 }),
    getAdminQuestionBanks(),
    questionBankManagementService.listQuestionBanks({ page: 1, pageSize: 20 }),
  ])

  return (
    <ContentEditorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Question bank CMS"
          description="Create, review, and manage question banks and question content."
        />

        <QuestionBankPageClient
          initialQuestions={library.items}
          initialQuestionsTotal={library.total}
          questionBanksForSelect={banks.map((bank: { id: string; title: string }) => ({
            id: bank.id,
            title: bank.title,
          }))}
          initialQuestionBanks={qbList.items}
          initialQuestionBanksTotal={qbList.total}
        />
      </div>
    </ContentEditorLayout>
  )
}
