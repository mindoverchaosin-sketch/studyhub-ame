import { notFound, redirect } from 'next/navigation'
import { requireStudent } from '@/auth'
import { processCompletedAttemptAction, listExamHistoryAction } from '@/server/actions/exam-attempt.actions'
import Link from 'next/link'
import TopicAnalysis from '@/components/mock-tests/TopicAnalysis'
import PerformanceHistory from '@/components/mock-tests/PerformanceHistory'

type Props = { params: { attemptId: string } }

type HistoryItem = {
  id: string
  title: string
  date: string
  score: number
  percentage: number
  durationMinutes: number
  passed: boolean
}

export default async function ResultsPage({ params }: Props) {
  let sessionUser
  try {
    sessionUser = await requireStudent()
  } catch {
    redirect('/login')
  }

  const completion = await processCompletedAttemptAction(params.attemptId)
  if (!completion) return notFound()

  const history = await listExamHistoryAction(sessionUser.user.id as string)
  const historyItems: HistoryItem[] = history.map((item) => ({
    id: item.attemptId,
    title: item.attemptId,
    date: item.date,
    score: item.score,
    percentage: item.percentage,
    durationMinutes: item.durationSeconds !== null ? Math.max(0, Math.round(item.durationSeconds / 60)) : 0,
    passed: item.passed,
  }))

  const analytics = completion.analytics
  const timeTaken = analytics.timeTakenSeconds !== null ? `${Math.floor(analytics.timeTakenSeconds / 60)}m ${analytics.timeTakenSeconds % 60}s` : 'N/A'
  const passFail = analytics.passed ? 'Pass' : 'Fail'

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Exam Intelligence</p>
          <h1 className="mt-3 text-3xl font-semibold">{analytics.examTitle}</h1>
          <p className="mt-2 text-slate-600">Detailed analytics, readiness insights, and targeted next steps from your completed attempt.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Score</p>
            <p className="mt-3 text-4xl font-semibold">{analytics.score}</p>
          </div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Percentage</p>
            <p className="mt-3 text-4xl font-semibold">{analytics.percentage.toFixed(1)}%</p>
          </div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Result</p>
            <p className="mt-3 text-4xl font-semibold">{passFail}</p>
          </div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Time taken</p>
            <p className="mt-3 text-4xl font-semibold">{timeTaken}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <TopicAnalysis breakdown={analytics.topicAnalytics.perTopic.map((topic) => ({ topic: topic.title, accuracy: topic.accuracy }))} />
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Readiness score</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Avg {analytics.timeAnalytics.averageSecondsPerQuestion}s</span>
              </div>
              <div className="mt-5 rounded-3xl bg-blue-950 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Confidence</p>
                <p className="mt-3 text-5xl font-semibold">{analytics.readiness.readinessPercentage}%</p>
                <p className="mt-2 text-lg font-medium">{analytics.readiness.confidence}</p>
              </div>
              <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Next actions</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                  {analytics.readiness.nextActions.map((action) => <li key={action}>{action}</li>)}
                </ul>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <PerformanceHistory history={historyItems} />
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Difficulty analysis</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {[
                  { label: 'Beginner', bucket: analytics.difficultyAnalytics.easy },
                  { label: 'Intermediate', bucket: analytics.difficultyAnalytics.medium },
                  { label: 'Advanced', bucket: analytics.difficultyAnalytics.hard },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold">{item.bucket.accuracy}%</p>
                    <p className="mt-2 text-sm text-slate-700">{item.bucket.correct} / {item.bucket.attempted} correct</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Time analysis</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Avg {analytics.timeAnalytics.averageSecondsPerQuestion}s</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Fastest questions</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {analytics.timeAnalytics.fastestQuestions.map((item) => (
                  <li key={item.id}>{item.prompt} — {item.seconds}s</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Slowest questions</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {analytics.timeAnalytics.slowestQuestions.map((item) => (
                  <li key={item.id}>{item.prompt} — {item.seconds}s</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Distribution</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {analytics.timeAnalytics.distribution.map((item) => (
                  <li key={item.label}>{item.label}: {item.count}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/student/mock-exams/history" className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-slate-700 transition hover:bg-slate-50">View history</Link>
          <Link href="/student/mock-exams" className="rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700">Back to mock exams</Link>
        </div>
      </div>
    </div>
  )
}
