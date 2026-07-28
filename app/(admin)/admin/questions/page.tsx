import PageHeader from '@/features/admin/components/PageHeader'
import QuestionBankPage from './QuestionBankPage'

export default function QuestionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank CMS"
        description="Create, review, and manage admin question banks and question content."
      />
      <QuestionBankPage />
    </div>
  )
}
