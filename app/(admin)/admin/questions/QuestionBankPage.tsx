import { requirePermission } from '@/auth'
import QuestionBankDirectoryPanel from '@/components/admin/questions/QuestionBankDirectoryPanel'
import QuestionBankPanel from '@/components/admin/questions/QuestionBankPanel'
import { getAdminQuestionBanks, getAdminQuestionLibrary } from '@/server/services/question.service'
import { questionBankManagementService } from '@/server/services/question-bank-management.service'
import QuestionBankPageClient from './QuestionBankPageClient'

export default async function QuestionBankPage() {
  await requirePermission('manageQuestions')

  const [library, banks, qbList] = await Promise.all([
    getAdminQuestionLibrary({ page: 1, pageSize: 20 }),
    getAdminQuestionBanks(),
    questionBankManagementService.listQuestionBanks({ page: 1, pageSize: 20 }),
  ])

  return (
    <QuestionBankPageClient
      initialQuestions={library.items}
      initialQuestionsTotal={library.total}
      questionBanksForSelect={banks.map((bank: { id: string; title: string }) => ({ id: bank.id, title: bank.title }))}
      initialQuestionBanks={qbList.items}
      initialQuestionBanksTotal={qbList.total}
    />
  )
}