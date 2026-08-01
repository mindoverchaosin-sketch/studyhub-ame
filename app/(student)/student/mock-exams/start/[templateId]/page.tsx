import { notFound, redirect } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getExamTemplate, generateAttempt } from '@/server/actions/exam.actions'
import { requireStudent } from '@/auth'
import Link from 'next/link'

async function startExam(formData: FormData) {
  'use server'

  const templateId = formData.get('templateId')?.toString()
  if (!templateId) return

  const session = await requireStudent()
  const attempt = await generateAttempt(templateId, session.user.id)
  redirect(`/student/mock-exams/${attempt.id}`)
}

type Props = {
  params: { templateId: string }
}

export default async function ExamStartPage({ params }: Props) {
  await requireStudent()
  const template = await getExamTemplate(params.templateId)
  if (!template) return notFound()

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Mock exam instructions</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{template.name}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Prepare for a focused mock exam experience. Read the instructions below, then begin your timed practice session.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-950">Before you start</h2>
              <p className="text-sm leading-7 text-slate-600">
                This mock exam simulates an exam environment with a strict timer, answer auto-save, and review navigation.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="space-y-3 bg-slate-50 border-slate-200">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Duration</p>
                <p className="text-2xl font-semibold text-slate-950">{template.durationMinutes} minutes</p>
              </Card>
              <Card className="space-y-3 bg-slate-50 border-slate-200">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Questions</p>
                <p className="text-2xl font-semibold text-slate-950">{template.questionCount}</p>
              </Card>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">What to expect</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  <li>• Your answers are auto-saved as you progress.</li>
                  <li>• You can bookmark questions and mark them for review.</li>
                  <li>• The timer continues even if you navigate away from the page.</li>
                  <li>• After submission, you will receive a score summary and performance analytics.</li>
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Ready to begin?</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Keep your workspace distraction-free, and use the review tools to flag questions you want to revisit before final submission.
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <Card className="space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Exam summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Quick facts</h2>
              </div>
              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">Template</p>
                  <p>{template.name}</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">Passing score</p>
                  <p>{template.passingPercentage}%</p>
                </div>
              </div>
              <form action={startExam} className="space-y-4">
                <input type="hidden" name="templateId" value={template.id} />
                <Button type="submit" variant="primary" size="lg" className="w-full">Start exam</Button>
                <Link href="/student/mock-exams" className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Back to mock exams
                </Link>
              </form>
            </Card>

            <Card className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Exam support</p>
              <ul className="space-y-3 text-sm leading-7 text-slate-600">
                <li>• Clear your answer before submission if needed.</li>
                <li>• Use the question palette to jump instantly between questions.</li>
                <li>• Mark for review and revisit questions quickly.</li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
