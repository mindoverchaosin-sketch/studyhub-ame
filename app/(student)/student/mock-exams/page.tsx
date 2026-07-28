import React from 'react'
import { listExamTemplates, generateAttempt } from '@/server/actions/exam.actions'
import Link from 'next/link'

export default async function StudentMockExamsPage() {
  const templates = await listExamTemplates({ active: true, pageSize: 50 })

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mock Exams</h1>
          <p className="text-sm text-slate-600">Start new attempts and review your exam history for smarter preparation.</p>
        </div>
        <Link href="/student/mock-exams/history" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">View history</Link>
      </div>

      <div className="mt-4">
        {templates.length === 0 ? (
          <p>No active exams available</p>
        ) : (
          <ul className="space-y-2">
            {templates.map((t: any) => (
              <li key={t.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.description}</div>
                </div>
                <div>
                  <Link href="#" className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">Start</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
