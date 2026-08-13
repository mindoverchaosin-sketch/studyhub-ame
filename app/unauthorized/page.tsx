import Link from 'next/link';

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }> | { reason?: string };
}) {
  const params = await Promise.resolve(searchParams ?? {});
  const isRoleMismatch = params.reason === 'role-mismatch';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Access denied</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950">
          {isRoleMismatch ? 'This account is not authorized for this workspace.' : 'You do not have permission to view this area.'}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {isRoleMismatch
            ? 'The role attached to this account does not match the requested dashboard. Please sign in to the correct workspace.'
            : 'This area requires the appropriate current role and approval status. Contact the platform admin if you believe this is an error.'}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Student Login</Link>
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Go home</Link>
        </div>
      </div>
    </main>
  );
}
