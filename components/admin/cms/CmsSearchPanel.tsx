"use client";

import { useMemo, useState } from 'react';
import type { CmsSearchItem } from '@/server/services/cms-search.service';

export function CmsSearchPanel({ items, defaultType = 'all' }: { items: CmsSearchItem[]; defaultType?: string }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState(defaultType);
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'updatedAt'>('title');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matching = items.filter((item) => {
      const matchesQuery = !normalizedQuery || `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(normalizedQuery);
      const matchesType = !type || type === 'all' || item.type === type;
      const matchesStatus = !status || status === 'all' || item.status === status;
      return matchesQuery && matchesType && matchesStatus;
    });

    return matching.sort((left, right) => {
      if (sortBy === 'updatedAt') {
        return (right.status ?? '').localeCompare(left.status ?? '');
      }
      return left.title.localeCompare(right.title);
    });
  }, [items, query, sortBy, status, type]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="w-full rounded-2xl border border-slate-200 px-3 py-2 md:max-w-xs" placeholder="Search lessons, modules, questions, mock tests, and media" />
        <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="all">All content</option>
          <option value="lesson">Lessons</option>
          <option value="module">Modules</option>
          <option value="question">Questions</option>
          <option value="mock-test">Mock tests</option>
          <option value="media">Media</option>
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="all">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Archived">Archived</option>
        </select>
        <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as 'title' | 'updatedAt'); setPage(1); }} className="rounded-2xl border border-slate-200 px-3 py-2">
          <option value="title">Sort by title</option>
          <option value="updatedAt">Sort by status</option>
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {paged.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">{item.title}</p>
            {item.subtitle ? <p className="text-sm text-slate-600">{item.subtitle}</p> : null}
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{item.type} • {item.status ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Page {page} of {pageCount}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">Prev</button>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="rounded-full border border-slate-200 px-3 py-2 text-sm disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
