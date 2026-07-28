import { requireStudent } from '@/auth'
import { redirect } from 'next/navigation'
import { listExamHistoryAction } from '@/server/actions/exam-attempt.actions'

export default async function HistoryPage() {
  let sessionUser

  try {
    sessionUser = await requireStudent()
  } catch {
    redirect('/login')
  }

  const history = await listExamHistoryAction(sessionUser.user.id as string)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Exam History</p>
          <h1 className="mt-3 text-3xl font-semibold">Recent mock exam attempts</h1>
          <p className="mt-2 text-slate-600">Review your performance trends, duration, and pass/fail history to plan targeted practice.</p>
        </header>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4 border-b pb-3 text-sm uppercase tracking-[0.2em] text-slate-500 sm:grid-cols-5">
            <div>Date</div>
            <div>Score</div>
            <div>Percentage</div>
            <div>Duration</div>
            <div className="text-right">Status</div>
          </div>
          <div className="divide-y divide-slate-200">
            {history.map((item) => (
              <div key={item.attemptId} className="grid grid-cols-2 gap-4 py-4 text-sm sm:grid-cols-5 sm:items-center">
                <div>{new Date(item.date).toLocaleDateString()}</div>
                <div>{item.score}</div>
                <div>{item.percentage}%</div>
                <div>{item.durationSeconds !== null ? `${Math.floor(item.durationSeconds / 60)}m ${item.durationSeconds % 60}s` : 'N/A'}</div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{item.passed ? 'Passed' : 'Failed'}</span>
                  <span className="ml-2 text-slate-500">{item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}</span>
                </div>
              </div>
            ))}
          </div>
          {history.length === 0 && <p className="mt-4 text-sm text-slate-600">No exam history yet. Complete a mock exam to populate this view.</p>}
        </div>
      </div>
    </div>
  )
}
