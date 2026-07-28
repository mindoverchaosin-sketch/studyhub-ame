type DailyGoalCardProps = {
  minutesStudiedToday: number
  dailyTarget: number
  remainingTime: number
}

export default function DailyGoalCard({ minutesStudiedToday, dailyTarget, remainingTime }: DailyGoalCardProps) {
  const progressPercent = Math.min(100, Math.round((minutesStudiedToday / dailyTarget) * 100))

  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Daily goal</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{minutesStudiedToday} min</h3>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {progressPercent}%
        </span>
      </div>

      <div className="mt-5 h-2.5 rounded-full bg-slate-100">
        <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${Math.max(6, progressPercent)}%` }} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.25rem] bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Today</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{minutesStudiedToday} min studied</p>
        </div>
        <div className="rounded-[1.25rem] bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Remaining</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{remainingTime} min left</p>
        </div>
      </div>
    </section>
  )
}
