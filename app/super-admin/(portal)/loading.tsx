export default function SuperAdminLoading() {
  return (
    <div aria-label="Loading platform data" role="status" className="animate-pulse space-y-6">
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 rounded-md border border-slate-200 bg-white" />)}
      </div>
      <div className="h-64 rounded-md border border-slate-200 bg-white" />
    </div>
  )
}