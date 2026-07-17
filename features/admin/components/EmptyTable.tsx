import type { ReactNode } from "react"

type EmptyTableProps = {
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyTable({ title, description, action }: EmptyTableProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm shadow-slate-900/5">
      <p className="text-xl font-semibold text-slate-950">{title}</p>
      {description ? <p className="mt-3 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
