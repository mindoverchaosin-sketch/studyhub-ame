import Link from "next/link"

export default function SuperAdminPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-500">
        <Link href="/super-admin/dashboard" className="hover:text-slate-900">Platform Control</Link>
        <span aria-hidden="true" className="mx-2">/</span>
        <span aria-current="page" className="text-slate-700">{title}</span>
      </nav>
      <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </header>
  )
}