'use client'

export default function PublishingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="rounded-md border border-rose-200 bg-rose-50 p-6" role="alert">
      <h2 className="font-semibold text-rose-950">Publishing inventory could not be loaded</h2>
      <p className="mt-2 text-sm text-rose-900">The content service returned an error. Try again, and contact an administrator if it continues.</p>
      <button type="button" onClick={reset} className="mt-4 min-h-10 rounded-md border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-950 hover:bg-rose-100">
        Retry
      </button>
    </section>
  )
}
