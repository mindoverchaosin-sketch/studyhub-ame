import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Access denied</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">You do not have permission to view this area.</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">Please sign in with an account that has the required access level or return to the dashboard.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Go home</Link>
          <Link href="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
