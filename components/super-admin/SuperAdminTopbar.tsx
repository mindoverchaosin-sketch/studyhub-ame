import LogoutButton from "@/components/dashboard/LogoutButton"

export default function SuperAdminTopbar({ name, email }: { name: string; email?: string | null }) {
  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Platform administration</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{name}</p>
        {email ? <p className="text-xs text-slate-500">{email}</p> : null}
      </div>
      <LogoutButton />
    </header>
  )
}