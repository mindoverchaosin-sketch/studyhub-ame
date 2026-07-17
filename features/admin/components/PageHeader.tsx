import type { ReactNode } from "react"
import Heading from "@/components/ui/Heading"

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export default function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="space-y-4 pb-6">
      {breadcrumbs ? (
        <div className="text-sm text-slate-500">
          {breadcrumbs.map((item, index) => (
            <span key={item.label}>
              {item.href ? <a href={item.href} className="text-slate-500 hover:text-slate-900">{item.label}</a> : item.label}
              {index < breadcrumbs.length - 1 ? <span className="px-2">/</span> : null}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="h1" size="xl">{title}</Heading>
          {description ? <p className="mt-3 max-w-2xl text-sm text-slate-600">{description}</p> : null}
        </div>
        <div className="flex items-center gap-3">{actions}</div>
      </div>
    </div>
  )
}
