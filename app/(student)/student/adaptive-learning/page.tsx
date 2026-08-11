import { requireStudent } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { getAdaptiveLearningData } from '@/server/services/adaptive-learning.service'

export default async function AdaptiveLearningPage() {
  let sessionUser

  try {
    sessionUser = await requireStudent()
  } catch {
    redirect('/login')
  }

  const adaptiveData = await getAdaptiveLearningData(sessionUser.user.id as string)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Student workspace</p>
              <h1 className="mt-2 text-3xl font-semibold">Adaptive Learning</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">Focused revision for your next strong study block.</p>
            </div>
            <Link href="/student/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">
              <FiArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
            </Link>
          </div>
        </div>
        <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Adaptive learning</p>
          <h1 className="mt-3 text-3xl font-semibold">Focused revision for your next strong study block</h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
            Review your weakest topics, lean on spaced repetition, and keep your momentum going with a plan shaped by recent quiz performance.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Revision queue</h2>
                <p className="mt-1 text-sm text-slate-600">Topics that need the most attention today.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {adaptiveData.reviewQueue.map((item) => (
                <a key={item.id} href={item.href} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">{item.priority}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Performance snapshot</h2>
            <p className="mt-2 text-sm text-slate-600">Recent accuracy and the topics to revisit.</p>
            <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Recent accuracy</p>
              <p className="mt-2 text-4xl font-semibold">{adaptiveData.performanceSummary.recentAccuracy}%</p>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Weak topics</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                  {adaptiveData.performanceSummary.weakTopics.map((topic) => <li key={topic}>{topic}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Improving topics</p>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                  {adaptiveData.performanceSummary.improvedTopics.map((topic) => <li key={topic}>{topic}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Recommendations</h2>
            <div className="mt-5 space-y-3">
              {adaptiveData.recommendations.map((item) => (
                <a key={item.id} href={item.href} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Spaced repetition</h2>
            <div className="mt-5 space-y-3">
              {adaptiveData.spacedRepetition.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.dueLabel}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Goals</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Daily</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{adaptiveData.goals.daily.completed}/{adaptiveData.goals.daily.target} min</p>
              <p className="mt-1 text-sm text-slate-600">{adaptiveData.goals.daily.remaining} minutes remaining</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Weekly</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{adaptiveData.goals.weekly.completed}/{adaptiveData.goals.weekly.target} min</p>
              <p className="mt-1 text-sm text-slate-600">{adaptiveData.goals.weekly.remaining} minutes remaining</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
