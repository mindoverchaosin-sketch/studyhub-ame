import { requirePermission } from '@/auth'
import QuestionBankDirectoryPanel from '@/components/admin/questions/QuestionBankDirectoryPanel'
import { getAdminQuestionBanks, getAdminQuestionLibrary } from '@/server/services/question.service'

export default async function QuestionBankPage() {
  await requirePermission('manageQuestions')

  const [library, banks] = await Promise.all([getAdminQuestionLibrary({ page: 1, pageSize: 20 }), getAdminQuestionBanks()])

  return (
    <QuestionBankDirectoryPanel
      initialQuestions={library.items}
      initialTotal={library.total}
      questionBanks={banks.map((bank: { id: string; title: string }) => ({ id: bank.id, title: bank.title }))}
    />
  )
}
