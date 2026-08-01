"use server"

import { loadAttemptAction } from '@/server/actions/exam-attempt.actions'
import { notFound } from 'next/navigation'

type Props = { params: { attemptId: string } }

export default async function AttemptPage({ params }: Props) {
  const attempt = await loadAttemptAction(params.attemptId)
  if (!attempt) return notFound()

  const ExamPlayer = (await import('./ExamPlayer.client')).default
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Mock Exam — Attempt</h1>
      <ExamPlayer initialAttempt={attempt} />
    </div>
  )
}
