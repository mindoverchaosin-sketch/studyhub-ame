"use server"

import React from 'react'
import { loadAttemptAction, saveAnswerAction, bookmarkAction, markForReviewAction, submitAttemptAction } from '@/server/actions/exam-attempt.actions'
import { notFound } from 'next/navigation'

type Props = { params: { attemptId: string } }

export default async function AttemptPage({ params }: Props) {
  const attempt = await loadAttemptAction(params.attemptId)
  if (!attempt) return notFound()

  // server-rendered initial state; client will take over for interactivity
  const ExamPlayer = (await import('./ExamPlayer.client')).default
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Mock Exam — Attempt</h1>
      <ExamPlayer initialAttempt={attempt} />
    </div>
  )
}
