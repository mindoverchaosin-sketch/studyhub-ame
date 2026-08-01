import type { AdminMockTest } from '@/types/admin';

export function MockTestForm({
  value,
  onChange,
  errors,
  onSubmit,
  onCancel,
  submitting,
}: {
  value: Partial<AdminMockTest>;
  onChange: (changes: Partial<AdminMockTest>) => void;
  errors: string[];
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      {errors.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <ul className="list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <label className="block text-sm font-medium text-slate-700">
        Mock test title
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={value.title || ''} onChange={(event) => onChange({ title: event.target.value })} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Duration (minutes)
          <input type="number" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={value.durationMinutes ?? ''} onChange={(event) => onChange({ durationMinutes: Number(event.target.value) })} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Passing percentage
          <input type="number" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={value.passingPercentage ?? ''} onChange={(event) => onChange({ passingPercentage: Number(event.target.value) })} />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Question count
          <input type="number" className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={value.questionCount ?? ''} onChange={(event) => onChange({ questionCount: Number(event.target.value) })} />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={value.randomized ?? false} onChange={(event) => onChange({ randomized: event.target.checked })} />
          Randomize question order
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input id="mock-published" type="checkbox" checked={value.status === 'Published'} onChange={(event) => onChange({ status: event.target.checked ? 'Published' : 'Draft' })} />
        <label htmlFor="mock-published" className="text-sm text-slate-700">Published</label>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
        <button type="button" onClick={onSubmit} disabled={submitting} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting ? 'Saving...' : 'Save mock test'}</button>
      </div>
    </div>
  );
}
