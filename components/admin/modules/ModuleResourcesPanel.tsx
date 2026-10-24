"use client";

import { useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import { hasPermission } from "@/server/services/authorization.service";
import {
  approveStudyMaterialAction,
  archiveStudyMaterialEditorialAction,
  publishStudyMaterialAction,
  rejectStudyMaterialAction,
  submitStudyMaterialForReviewAction,
  unpublishStudyMaterialEditorialAction,
} from "@/server/actions/study-material-editorial.actions";
import type { ResourceDTO } from "@/server/application/dto/resource.dto";

interface ModuleResourcesPanelProps {
  moduleId: string;
  resources: ResourceDTO[];
}

type EditorialStatus = NonNullable<ResourceDTO["editorialStatus"]>;

export default function ModuleResourcesPanel({ moduleId, resources }: ModuleResourcesPanelProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editorialStatuses, setEditorialStatuses] = useState<Record<string, EditorialStatus>>({});
  const actionInProgress = useRef(false);
  const { data: session } = useSession();
  const role = session?.user?.role;
  const canManageResources = hasPermission(role, "manageResources");
  const canPublish = hasPermission(role, "publishContent");

  const visibleResources = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesSearch = !lowerSearch || resource.title.toLowerCase().includes(lowerSearch) || resource.url.toLowerCase().includes(lowerSearch);
      const matchesType = type === "ALL" || resource.type === type;
      const matchesStatus = status === "ALL" || resource.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, search, type, status]);

  async function runAction(
    resource: ResourceDTO,
    label: string,
    nextStatus: EditorialStatus,
    action: () => Promise<unknown>,
  ) {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    setPendingResourceId(resource.id);
    setFeedback(null);
    try {
      await action();
      setEditorialStatuses((current) => ({ ...current, [resource.id]: nextStatus }));
      setFeedback({ type: "success", message: `${label} completed for "${resource.title}".` });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : `Unable to ${label.toLowerCase()}. Please try again.`,
      });
    } finally {
      actionInProgress.current = false;
      setPendingResourceId(null);
    }
  }

  const buttonClass = "rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

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
              <option value="IN_REVIEW">In review</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {feedback ? (
        <p role={feedback.type === "error" ? "alert" : "status"} className={`mx-6 mt-4 rounded-xl border px-3 py-2 text-sm ${feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {feedback.message}
        </p>
      ) : null}

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
            {visibleResources.map((resource) => {
              const editorialStatus = editorialStatuses[resource.id] ?? resource.editorialStatus ?? resource.status;
              const busy = pendingResourceId !== null;

              return (
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
                        {canManageResources && editorialStatus === "DRAFT" ? (
                          <button type="button" disabled={busy} onClick={() => runAction(resource, "Submit for review", "IN_REVIEW", () => submitStudyMaterialForReviewAction(resource.id, moduleId))} className={buttonClass}>
                            {pendingResourceId === resource.id ? "Submitting..." : "Review"}
                          </button>
                        ) : null}
                        {canPublish && editorialStatus === "IN_REVIEW" ? (
                          <>
                            <button type="button" disabled={busy} onClick={() => runAction(resource, "Approve", "APPROVED", () => approveStudyMaterialAction(resource.id, moduleId))} className={buttonClass}>
                              {pendingResourceId === resource.id ? "Approving..." : "Approve"}
                            </button>
                            <button type="button" disabled={busy} onClick={() => runAction(resource, "Reject", "DRAFT", () => rejectStudyMaterialAction(resource.id, moduleId, "Needs revision"))} className="rounded-full border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
                              {pendingResourceId === resource.id ? "Rejecting..." : "Reject"}
                            </button>
                          </>
                        ) : null}
                        {canPublish && editorialStatus === "APPROVED" ? (
                          <button type="button" disabled={busy} onClick={() => runAction(resource, "Publish", "PUBLISHED", () => publishStudyMaterialAction(resource.id, moduleId))} className="rounded-full border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {pendingResourceId === resource.id ? "Publishing..." : "Publish"}
                          </button>
                        ) : null}
                        {canPublish && editorialStatus === "PUBLISHED" ? (
                          <button type="button" disabled={busy} onClick={() => runAction(resource, "Unpublish", "DRAFT", () => unpublishStudyMaterialEditorialAction(resource.id, moduleId))} className={buttonClass}>
                            {pendingResourceId === resource.id ? "Unpublishing..." : "Unpublish"}
                          </button>
                        ) : null}
                        {canPublish && editorialStatus !== "ARCHIVED" ? (
                          <button type="button" disabled={busy} onClick={() => runAction(resource, "Archive", "ARCHIVED", () => archiveStudyMaterialEditorialAction(resource.id, moduleId))} className={buttonClass}>
                            {pendingResourceId === resource.id ? "Archiving..." : "Archive"}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No actions available</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleResources.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">No resources match your filters.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
