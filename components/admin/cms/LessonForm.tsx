import { MediaLibraryPanel } from '@/components/admin/cms/MediaLibraryPanel';
import type { AdminLesson, AdminModuleOption } from '@/types/admin';

export function LessonForm({
  value,
  modules,
  onChange,
  errors,
  onSubmit,
  onCancel,
  submitting,
}: {
  value: Partial<AdminLesson>;
  modules: AdminModuleOption[];
  onChange: (changes: Partial<AdminLesson>) => void;
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
        Lesson title
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={value.title || ''} onChange={(event) => onChange({ title: event.target.value })} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Module
        <select
          value={value.moduleId || ''}
          onChange={(event) => {
            const selectedId = event.target.value;
            const selected = modules.find((module) => module.id === selectedId);
            onChange({ moduleId: selectedId || undefined, moduleTitle: selected?.title || undefined, module: selected?.title || '' });
          }}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2"
        >
          <option value="">Select a module</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>{module.title}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Content
        <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-3 py-2" value={value.content || ''} onChange={(event) => onChange({ content: event.target.value })} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Objectives (comma separated)
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={(value.objectives || []).join(', ')} onChange={(event) => onChange({ objectives: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Key points (comma separated)
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={(value.keyPoints || []).join(', ')} onChange={(event) => onChange({ keyPoints: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Resources (comma separated)
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={(value.resources || []).join(', ')} onChange={(event) => onChange({ resources: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Attachments (comma separated)
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={(value.attachments || []).join(', ')} onChange={(event) => onChange({ attachments: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Reference links (comma separated)
        <input className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2" value={(value.referenceLinks || []).join(', ')} onChange={(event) => onChange({ referenceLinks: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Media library</h3>
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Reusable assets</span>
        </div>
        <MediaLibraryPanel
          attachedIds={value.attachments || []}
          onSelect={(assetId) => onChange({ attachments: [...new Set([...(value.attachments || []), assetId])] })}
          onUpload={async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch('/api/media', { method: 'POST', body: formData });
            if (response.ok) {
              const payload = await response.json() as { asset?: { id?: string } };
              if (payload.asset?.id) {
                onChange({ attachments: [...new Set([...(value.attachments || []), payload.asset.id])] });
              }
            }
          }}
          onRemove={(assetId) => onChange({ attachments: (value.attachments || []).filter((attachment) => attachment !== assetId) })}
        />
      </div>
      <div className="flex items-center gap-3">
        <input id="lesson-published" type="checkbox" checked={value.status === 'Published'} onChange={(event) => onChange({ status: event.target.checked ? 'Published' : 'Draft' })} />
        <label htmlFor="lesson-published" className="text-sm text-slate-700">Published</label>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
        <button type="button" onClick={onSubmit} disabled={submitting} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{submitting ? 'Saving...' : 'Save lesson'}</button>
      </div>
    </div>
  );
}
