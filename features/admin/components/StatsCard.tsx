import type { ReactNode } from "react"

type StatsCardProps = {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
}

export default function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{title}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        {icon ? <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">{icon}</div> : null}
      </div>
      {description ? <p className="mt-4 text-sm text-slate-500">{description}</p> : null}
    </div>
  )
}
