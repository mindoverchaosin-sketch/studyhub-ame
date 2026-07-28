"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import { approvePublishingAction, archiveContentAction, publishContentAction, rejectPublishingAction, submitForReviewAction, unpublishContentAction } from "@/server/actions/publishing.actions";
import type { ResourceDTO } from "@/server/application/dto/resource.dto";

interface ModuleResourcesPanelProps {
  resources: ResourceDTO[];
}

export default function ModuleResourcesPanel({ resources }: ModuleResourcesPanelProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const { data: session } = useSession();
  const role = (session?.user?.role as string | undefined) ?? 'STUDENT';
  const canManageResources = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CONTENT_MANAGER';
  const canPublish = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CONTENT_MANAGER' || role === 'QUESTION_REVIEWER';

  const visibleResources = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSearch = !lowerSearch || resource.title.toLowerCase().includes(lowerSearch) || resource.url.toLowerCase().includes(lowerSearch);
      const matchesType = type === "ALL" || resource.type === type;
      const matchesStatus = status === "ALL" || resource.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, search, type, status]);

  return (
    <Card variant="elevated" className="p-0">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Resources</h2>
            <p className="mt-1 text-sm text-slate-600">Manage study materials for this module.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources" className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500" />
            <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500">
              <option value="ALL">All types</option>
              <option value="NOTES">Notes</option>
              <option value="PDF">PDF</option>
              <option value="VIDEO">Video</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500">
              <option value="ALL">All status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleResources.map((resource) => (
              <tr key={resource.id} className="border-t border-slate-200 bg-white/80">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{resource.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{resource.url}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-700">{resource.type}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${resource.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : resource.status === "ARCHIVED" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-700"}`}>
                    {resource.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-700">{new Date(resource.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-4 text-slate-700">
                  {canManageResources || canPublish ? (
                    <div className="flex flex-wrap gap-2">
                      {canPublish ? (
                        <>
                          <button type="button" onClick={() => void submitForReviewAction('STUDY_MATERIAL', resource.id)} className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">Review</button>
                          <button type="button" onClick={() => void approvePublishingAction('STUDY_MATERIAL', resource.id)} className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">Approve</button>
                          <button type="button" onClick={() => void rejectPublishingAction('STUDY_MATERIAL', resource.id, 'Needs revision')} className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700">Reject</button>
                          <button type="button" onClick={() => void publishContentAction('STUDY_MATERIAL', resource.id)} className="rounded-full border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700">Publish</button>
                          <button type="button" onClick={() => void unpublishContentAction('STUDY_MATERIAL', resource.id)} className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">Unpublish</button>
                        </>
                      ) : null}
                      {canManageResources ? (
                        <button type="button" onClick={() => void archiveContentAction('STUDY_MATERIAL', resource.id)} className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700">Archive</button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No actions available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
