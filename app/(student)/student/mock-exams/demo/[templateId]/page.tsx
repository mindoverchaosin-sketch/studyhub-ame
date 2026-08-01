import { notFound } from 'next/navigation'
import { mockExamTemplates, mockExamQuestions } from '@/lib/mock/exams'
import type { ExamAttempt } from '@/types/exam'
import ExamPlayer from '../../[attemptId]/ExamPlayer.client'

export default async function DemoAttemptPage({ params }: { params: { templateId: string } }) {
  const { templateId } = params
  const template = mockExamTemplates.find((t) => t.id === templateId)
  if (!template) return notFound()

  // server components must be pure — do not call Date.now here.
  // Instead, pass a duration and let the client compute an expiration timestamp.
  const selectedQuestions = mockExamQuestions.slice(0, template.questionCount) // simple slice
  const attempt: ExamAttempt = {
    id: `demo-${template.id}`,
    templateId: template.id,
    title: template.title,
    durationMinutes: template.durationMinutes,
    questions: selectedQuestions.map((q, idx) => ({
      id: `demo-${template.id}-${q.id}-${idx}`,
      question: q.prompt,
      options: q.options,
      selectedOption: undefined,
      bookmarked: false,
      markedForReview: false,
      displayOrder: idx + 1,
    })),
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Demo Exam — {template.title}</h1>
      <p className="text-sm text-slate-600 mt-2">Duration: {template.durationMinutes} min • {template.questionCount} questions</p>

      <div className="mt-6">
        {/* client-side player */}
        <ExamPlayer initialAttempt={attempt} />
      </div>
    </div>
  )
}
