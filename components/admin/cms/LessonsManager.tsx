"use client";

import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/cms/ConfirmDialog';
import { EmptyState } from '@/components/admin/cms/EmptyState';
import { LessonForm } from '@/components/admin/cms/LessonForm';
import { LoadingState } from '@/components/admin/cms/LoadingState';
import { Modal } from '@/components/admin/cms/Modal';
import { StatusBadge } from '@/components/admin/cms/StatusBadge';
import { Toast } from '@/components/admin/cms/Toast';
import { adminContentService } from '@/services/admin/content.service';
import { buildDeleteConfirmationMessage, filterLessons, getNextStatus, validateLessonForm } from '@/services/admin/cms-utils';
import type { AdminLesson, AdminModuleOption } from '@/types/admin';

export function LessonsManager() {
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('All modules');
  const [sortKey, setSortKey] = useState<'title' | 'status' | 'updatedAt'>('updatedAt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null);
  const [draft, setDraft] = useState<Partial<AdminLesson>>({ status: 'Draft' });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLesson | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<AdminModuleOption[]>([]);
  const pageSize = 5;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [items, moduleItems] = await Promise.all([adminContentService.listLessons(), adminContentService.listModules()]);
      setLessons(items);
      setModules(moduleItems);
      setLoading(false);
    })();
  }, []);

  const visibleLessons = useMemo(() => filterLessons(lessons, search, module, sortKey), [lessons, module, search, sortKey]);
  const pageCount = Math.max(1, Math.ceil(visibleLessons.length / pageSize));
  const pagedLessons = visibleLessons.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditingLesson(null);
    const defaultModule = modules[0];
    setDraft({
      title: '',
      content: '',
      objectives: [],
      keyPoints: [],
      resources: [],
      attachments: [],
      referenceLinks: [],
      status: 'Draft',
      order: lessons.length + 1,
      moduleId: defaultModule?.id,
      moduleTitle: defaultModule?.title,
      module: defaultModule?.title,
    });
    setErrors([]);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const openEdit = (lesson: AdminLesson) => {
    setEditingLesson(lesson);
    setDraft({
      ...lesson,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.moduleTitle ?? lesson.module,
      module: lesson.moduleTitle ?? lesson.module,
    });
    setErrors([]);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLesson(null);
    setDraft({ status: 'Draft' });
    setErrors([]);
    setHasUnsavedChanges(false);
  };

  const onChange = (changes: Partial<AdminLesson>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setHasUnsavedChanges(true);
  };

  const saveLesson = async () => {
    const validationErrors = validateLessonForm(draft, lessons, editingLesson?.id);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setToast('Please correct the highlighted issues.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: draft.title?.trim() || '',
      content: draft.content?.trim() || '',
      objectives: draft.objectives || [],
      keyPoints: draft.keyPoints || [],
      resources: draft.resources || [],
      attachments: draft.attachments || [],
      referenceLinks: draft.referenceLinks || [],
      status: draft.status || 'Draft',
      order: draft.order || lessons.length + 1,
      moduleId: draft.moduleId,
    };

    const savedLesson = editingLesson
      ? await adminContentService.updateLesson(editingLesson.id, payload)
      : await adminContentService.createLesson(payload);

    setSubmitting(false);
    if (savedLesson) {
      setLessons((current) => editingLesson ? current.map((lesson) => lesson.id === editingLesson.id ? savedLesson : lesson) : [savedLesson, ...current]);
      setErrors([]);
      setHasUnsavedChanges(false);
      setToast(editingLesson ? 'Lesson updated.' : 'Lesson created.');
      closeModal();
      return;
    }

    setToast('Unable to save lesson.');
  };

  const requestDelete = (lesson: AdminLesson) => {
    setDeleteTarget(lesson);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const deleted = await adminContentService.deleteLesson(deleteTarget.id);
    if (deleted) {
      setLessons((current) => current.filter((lesson) => lesson.id !== deleteTarget.id));
      setToast('Lesson deleted.');
    } else {
      setToast('Unable to delete lesson.');
    }
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const togglePublished = async (lesson: AdminLesson) => {
    const nextStatus = getNextStatus(lesson.status);
    const updatedLesson = await adminContentService.setLessonPublishState(lesson.id, nextStatus === 'Published');
    if (updatedLesson) {
      setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, status: updatedLesson.status, updatedAt: updatedLesson.updatedAt } : item));
      setToast(`Lesson marked ${nextStatus.toLowerCase()}.`);
      return;
    }
    setToast('Unable to update lesson status.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Content editor</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Lessons</h1>
          <p className="mt-2 text-sm text-slate-600">Create, edit, filter, and publish lesson content from a polished admin workspace.</p>
        </div>
        <button onClick={openCreate} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create lesson</button>
      </div>

      {hasUnsavedChanges ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">You have unsaved changes.</div> : null}
      {toast ? <Toast message={toast} /> : null}

      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <input aria-label="Search lessons" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search lessons" className="w-full rounded-2xl border border-slate-200 px-3 py-2 md:max-w-xs" />
        <select aria-label="Filter by module" value={module} onChange={(event) => { setModule(event.target.value); setPage(1); }} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="All modules">All modules</option>
          <option value="Aircraft Materials">Aircraft Materials</option>
          <option value="Hydraulic Systems">Hydraulic Systems</option>
        </select>
        <select aria-label="Sort lessons" value={sortKey} onChange={(event) => { setSortKey(event.target.value as 'title' | 'status' | 'updatedAt'); setPage(1); }} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="updatedAt">Sort by updated</option>
          <option value="title">Sort by title</option>
          <option value="status">Sort by status</option>
        </select>
      </div>

      {loading ? <LoadingState label="Loading lessons..." /> : pagedLessons.length === 0 ? <EmptyState title="No lessons match your filters" description="Try a broader search or create a new lesson." /> : (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Title</th>
                <th scope="col" className="px-4 py-3 font-semibold">Module</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Updated</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedLessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{lesson.title}</td>
                  <td className="px-4 py-3 text-slate-700">{lesson.module || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={lesson.status} /></td>
                  <td className="px-4 py-3 text-slate-700">{lesson.updatedAt || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEdit(lesson)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Edit</button>
                      <button onClick={() => togglePublished(lesson)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">{lesson.status === 'Published' ? 'Unpublish' : 'Publish'}</button>
                      <button onClick={() => requestDelete(lesson)} className="rounded-full border border-rose-200 px-3 py-1 text-sm text-rose-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Page {page} of {pageCount}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">Prev</button>
          <button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="rounded-full border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">Next</button>
        </div>
      </div>

      <Modal open={isModalOpen} title={editingLesson ? 'Edit lesson' : 'Create lesson'} description="Draft lesson content and publish it when ready." onClose={closeModal}>
        <LessonForm value={draft} modules={modules} onChange={onChange} errors={errors} onSubmit={saveLesson} onCancel={closeModal} submitting={submitting} />
      </Modal>

      <ConfirmDialog open={isDeleteOpen} title="Delete lesson" message={buildDeleteConfirmationMessage(deleteTarget?.title || 'this lesson')} onCancel={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} />
    </div>
  );
}
