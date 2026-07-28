type StudyStreakCardProps = {
  currentStreak: number
  longestStreak: number
  weeklyCalendar: string[]
}

export default function StudyStreakCard({ currentStreak, longestStreak, weeklyCalendar }: StudyStreakCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Study streak</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{currentStreak} day streak</h3>
        </div>
        <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">Best {longestStreak}</div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {weeklyCalendar.map((day, index) => (
          <div key={`${day}-${index}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
            {day}
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-600">Keep the streak alive by studying a little every day.</p>
    </section>
  )
}
