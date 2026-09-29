"use client"

export default function SuperAdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section role="alert" className="rounded-md border border-rose-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-slate-950">Platform data could not be loaded</h1>
      <p className="mt-2 text-sm text-slate-600">The request failed. Retry, or return to the dashboard and try again.</p>
      <button type="button" onClick={reset} className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
        Retry
      </button>
    </section>
  )
}