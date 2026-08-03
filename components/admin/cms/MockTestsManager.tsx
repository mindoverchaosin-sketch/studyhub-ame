"use client";

import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/cms/ConfirmDialog';
import { EmptyState } from '@/components/admin/cms/EmptyState';
import { LoadingState } from '@/components/admin/cms/LoadingState';
import { MockTestForm } from '@/components/admin/cms/MockTestForm';
import { Modal } from '@/components/admin/cms/Modal';
import { StatusBadge } from '@/components/admin/cms/StatusBadge';
import { Toast } from '@/components/admin/cms/Toast';
import { adminContentService } from '@/services/admin/content.service';
import { buildDeleteConfirmationMessage, filterMockTests, getNextStatus, validateMockTestForm } from '@/services/admin/cms-utils';
import type { AdminMockTest } from '@/types/admin';

export function MockTestsManager() {
  const [mockTests, setMockTests] = useState<AdminMockTest[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [sortKey, setSortKey] = useState<'title' | 'status' | 'updatedAt'>('updatedAt');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingMockTest, setEditingMockTest] = useState<AdminMockTest | null>(null);
  const [draft, setDraft] = useState<Partial<AdminMockTest>>({ status: 'Draft', randomized: false });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminMockTest | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 5;

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const items = await adminContentService.listMockTests();
      setMockTests(items);
      setLoading(false);
    })();
  }, []);

  const visibleTests = useMemo(() => filterMockTests(mockTests, search, status, sortKey), [mockTests, search, status, sortKey]);
  const pageCount = Math.max(1, Math.ceil(visibleTests.length / pageSize));
  const pagedTests = visibleTests.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditingMockTest(null);
    setDraft({ title: '', durationMinutes: 45, passingPercentage: 70, questionCount: 20, randomized: true, status: 'Draft' });
    setErrors([]);
    setIsModalOpen(true);
  };

  const openEdit = (mockTest: AdminMockTest) => {
    setEditingMockTest(mockTest);
    setDraft({ ...mockTest });
    setErrors([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMockTest(null);
    setDraft({ status: 'Draft', randomized: false });
    setErrors([]);
  };

  const onChange = (changes: Partial<AdminMockTest>) => {
    setDraft((current) => ({ ...current, ...changes }));
  };

  const saveMockTest = async () => {
    const validationErrors = validateMockTestForm(draft, mockTests, editingMockTest?.id);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setToast('Please correct the highlighted issues.');
      return;
    }

    setSubmitting(true);
    const savedMockTest = editingMockTest
      ? await adminContentService.updateMockTest(editingMockTest.id, {
          title: draft.title?.trim() || '',
          durationMinutes: draft.durationMinutes || 45,
          passingPercentage: draft.passingPercentage || 70,
          questionCount: draft.questionCount || 20,
          randomized: draft.randomized ?? false,
          status: draft.status || 'Draft',
        })
      : await adminContentService.createMockTest({
          title: draft.title?.trim() || '',
          durationMinutes: draft.durationMinutes || 45,
          passingPercentage: draft.passingPercentage || 70,
          questionCount: draft.questionCount || 20,
          randomized: draft.randomized ?? false,
          status: draft.status || 'Draft',
        });

    setSubmitting(false);
    if (savedMockTest) {
      setMockTests((current) => editingMockTest ? current.map((item) => item.id === editingMockTest.id ? savedMockTest : item) : [savedMockTest, ...current]);
      setErrors([]);
      setToast(editingMockTest ? 'Mock test updated.' : 'Mock test created.');
      closeModal();
      return;
    }

    setToast('Unable to save mock test.');
  };

  const requestDelete = (mockTest: AdminMockTest) => {
    setDeleteTarget(mockTest);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const deleted = await adminContentService.deleteMockTest(deleteTarget.id);
    if (deleted) {
      setMockTests((current) => current.filter((item) => item.id !== deleteTarget.id));
      setToast('Mock test deleted.');
    } else {
      setToast('Unable to delete mock test.');
    }
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const duplicateMockTest = async (mockTest: AdminMockTest) => {
    const duplicated = await adminContentService.duplicateMockTest(mockTest.id);
    if (duplicated) {
      setMockTests((current) => [duplicated, ...current]);
      setToast('Mock test duplicated.');
      return;
    }
    setToast('Unable to duplicate mock test.');
  };

  const togglePublished = async (mockTest: AdminMockTest) => {
    const nextStatus = getNextStatus(mockTest.status);
    const updatedMockTest = await adminContentService.setMockTestPublishState(mockTest.id, nextStatus === 'Published');
    if (updatedMockTest) {
      setMockTests((current) => current.map((item) => item.id === mockTest.id ? { ...item, status: updatedMockTest.status, updatedAt: updatedMockTest.updatedAt } : item));
      setToast(`Mock test marked ${nextStatus.toLowerCase()}.`);
      return;
    }
    setToast('Unable to update mock test status.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Assessment builder</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Mock tests</h1>
          <p className="mt-2 text-sm text-slate-600">Create, edit, duplicate, publish, and manage exam templates with rich validation.</p>
        </div>
        <button onClick={openCreate} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Create mock test</button>
      </div>

      {toast ? <Toast message={toast} /> : null}

      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <input aria-label="Search mock tests" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search mock tests" className="w-full rounded-2xl border border-slate-200 px-3 py-2 md:max-w-xs" />
        <select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="All statuses">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
        </select>
        <select aria-label="Sort mock tests" value={sortKey} onChange={(event) => { setSortKey(event.target.value as 'title' | 'status' | 'updatedAt'); setPage(1); }} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="updatedAt">Sort by updated</option>
          <option value="title">Sort by title</option>
          <option value="status">Sort by status</option>
        </select>
      </div>

      {loading ? <LoadingState label="Loading mock tests..." /> : pagedTests.length === 0 ? <EmptyState title="No mock tests match your filters" description="Try broadening your search or create a new assessment." /> : (
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Title</th>
                <th scope="col" className="px-4 py-3 font-semibold">Duration</th>
                <th scope="col" className="px-4 py-3 font-semibold">Passing</th>
                <th scope="col" className="px-4 py-3 font-semibold">Questions</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedTests.map((mockTest) => (
                <tr key={mockTest.id}>
                  <td className="px-4 py-3 font-semibold text-slate-950">{mockTest.title}</td>
                  <td className="px-4 py-3 text-slate-700">{mockTest.durationMinutes} min</td>
                  <td className="px-4 py-3 text-slate-700">{mockTest.passingPercentage}%</td>
                  <td className="px-4 py-3 text-slate-700">{mockTest.questionCount}</td>
                  <td className="px-4 py-3"><StatusBadge status={mockTest.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEdit(mockTest)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Edit</button>
                      <button onClick={() => duplicateMockTest(mockTest)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">Duplicate</button>
                      <button onClick={() => togglePublished(mockTest)} className="rounded-full border border-slate-200 px-3 py-1 text-sm">{mockTest.status === 'Published' ? 'Unpublish' : 'Publish'}</button>
                      <button onClick={() => requestDelete(mockTest)} className="rounded-full border border-rose-200 px-3 py-1 text-sm text-rose-600">Delete</button>
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

      <Modal open={isModalOpen} title={editingMockTest ? 'Edit mock test' : 'Create mock test'} description="Configure the exam duration, scoring, and randomization options." onClose={closeModal}>
        <MockTestForm value={draft} onChange={onChange} errors={errors} onSubmit={saveMockTest} onCancel={closeModal} submitting={submitting} />
      </Modal>

      <ConfirmDialog open={isDeleteOpen} title="Delete mock test" message={buildDeleteConfirmationMessage(deleteTarget?.title || 'this mock test')} onCancel={() => setIsDeleteOpen(false)} onConfirm={confirmDelete} />
    </div>
  );
}
