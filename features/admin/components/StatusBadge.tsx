type StatusBadgeProps = {
  label: string
  tone?: "success" | "warning" | "danger" | "neutral"
}

const toneClasses = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  neutral: "bg-slate-100 text-slate-700",
} as const

export default function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  return <span className={['inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', toneClasses[tone]].join(' ')}>{label}</span>
}
