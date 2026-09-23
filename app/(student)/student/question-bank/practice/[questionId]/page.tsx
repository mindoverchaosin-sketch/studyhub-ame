import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireStudent } from '@/auth'
import Card from '@/components/ui/Card'
import QuestionPractice from '@/components/student/QuestionPractice'
import { getStudentQuestionPractice } from '@/server/services/student-question-bank.service'

export default async function QuestionPracticePage({ params }: { params: { questionId: string } }) {
  let session
  try {
    session = await requireStudent()
  } catch {
    redirect('/login')
  }

  const question = await getStudentQuestionPractice(session.user.id, params.questionId)
  if (!question) notFound()

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/student/question-bank" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Back to Question Bank</Link>
        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Independent practice</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">Question practice</h1>
            <p className="mt-2 text-sm text-slate-600">Select an answer to save your current practice state.</p>
          </div>
          <QuestionPractice question={question} />
        </Card>
      </div>
    </div>
  )
}
