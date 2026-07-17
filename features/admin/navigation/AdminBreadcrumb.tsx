import Link from "next/link"

type AdminBreadcrumbProps = {
  items: Array<{ label: string; href?: string }>
}

export default function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="text-slate-500 transition hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 ? <span aria-hidden="true">/</span> : null}
        </span>
      ))}
    </div>
  )
}
