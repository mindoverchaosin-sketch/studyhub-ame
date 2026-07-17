export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-36 rounded-[2rem] bg-slate-200" />
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="h-48 rounded-[1.75rem] bg-slate-200" />
          <div className="h-48 rounded-[1.75rem] bg-slate-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-[1.5rem] bg-slate-200" />
          <div className="h-28 rounded-[1.5rem] bg-slate-200" />
          <div className="h-28 rounded-[1.5rem] bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
