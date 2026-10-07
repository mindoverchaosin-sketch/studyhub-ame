"use client";

import { useRef, useState, type FormEvent } from "react";
import { archiveContentAction, approvePublishingAction, publishContentAction, rejectPublishingAction, submitForReviewAction, unpublishContentAction } from "@/server/actions/publishing.actions";
import { unarchiveModuleAction, updateModuleAction } from "@/server/actions/content-management.actions";
import type { ModuleDetailDTO } from "@/server/application/dto/module-management.dto";

type ModuleDetailActionsProps = {
  module: ModuleDetailDTO;
  canPublish: boolean;
};

export default function ModuleDetailActions({ module, canPublish }: ModuleDetailActionsProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const actionInProgress = useRef(false);

  async function runAction(label: string, action: () => Promise<unknown>) {
    if (actionInProgress.current) return;

    actionInProgress.current = true;
    setPendingAction(label);
    setFeedback(null);
    try {
      await action();
      setFeedback({ type: "success", message: `${label} completed.` });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "The action failed. Please try again.",
      });
    } finally {
      actionInProgress.current = false;
      setPendingAction(null);
    }
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await runAction("Save changes", () => updateModuleAction(module.id, {
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      moduleNumber: String(formData.get("moduleNumber") ?? ""),
      description: String(formData.get("description") ?? ""),
      status: String(formData.get("status") ?? "DRAFT"),
      difficulty: String(formData.get("difficulty") ?? "BEGINNER"),
      estimatedHours: Number(formData.get("estimatedHours") ?? 0),
      displayOrder: Number(formData.get("displayOrder") ?? 0),
    }));
  }

  const busy = pendingAction !== null;
  const buttonClass = "rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Manage module</h2>
      {feedback ? (
        <p
          role={feedback.type === "error" ? "alert" : "status"}
          className={`mt-4 rounded-xl border px-3 py-2 text-sm ${feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
        >
          {feedback.message}
        </p>
      ) : null}

      <form onSubmit={saveChanges} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Title</span>
          <input name="title" defaultValue={module.title} required disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Slug</span>
          <input name="slug" defaultValue={module.slug} required disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Module number</span>
          <input name="moduleNumber" defaultValue={module.moduleNumber} required disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Status</span>
          <select name="status" defaultValue={module.status} disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50">
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In review</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Difficulty</span>
          <select name="difficulty" defaultValue={module.difficulty} disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50">
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Estimated hours</span>
          <input name="estimatedHours" type="number" min="0" defaultValue={module.estimatedHours} disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Display order</span>
          <input name="displayOrder" type="number" min="0" defaultValue={module.displayOrder} disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Description</span>
          <textarea name="description" rows={3} defaultValue={module.description} disabled={busy} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50" />
        </label>
        <button type="submit" disabled={busy} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {pendingAction === "Save changes" ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-3">
        {module.status === "ARCHIVED" ? (
          <button type="button" disabled={busy} onClick={() => runAction("Unarchive", () => unarchiveModuleAction(module.id))} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {pendingAction === "Unarchive" ? "Unarchiving..." : "Unarchive"}
          </button>
        ) : canPublish ? (
          <>
            {module.status === "DRAFT" ? (
              <button type="button" disabled={busy} onClick={() => runAction("Submit for review", () => submitForReviewAction("MODULE", module.id))} className={buttonClass}>
                {pendingAction === "Submit for review" ? "Submitting..." : "Submit for review"}
              </button>
            ) : null}
            {module.status === "IN_REVIEW" ? (
              <>
                <button type="button" disabled={busy} onClick={() => runAction("Approve", () => approvePublishingAction("MODULE", module.id))} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                  {pendingAction === "Approve" ? "Approving..." : "Approve"}
                </button>
                <button type="button" disabled={busy} onClick={() => runAction("Reject", () => rejectPublishingAction("MODULE", module.id, "Needs revision"))} className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {pendingAction === "Reject" ? "Rejecting..." : "Reject"}
                </button>
              </>
            ) : null}
            {module.status === "DRAFT" ? (
              <button type="button" disabled={busy} onClick={() => runAction("Publish", () => publishContentAction("MODULE", module.id))} className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                {pendingAction === "Publish" ? "Publishing..." : "Publish"}
              </button>
            ) : null}
            {module.status === "PUBLISHED" || module.status === "SCHEDULED" ? (
              <button type="button" disabled={busy} onClick={() => runAction("Unpublish", () => unpublishContentAction("MODULE", module.id))} className={buttonClass}>
                {pendingAction === "Unpublish" ? "Unpublishing..." : "Unpublish"}
              </button>
            ) : null}
            <button type="button" disabled={busy} onClick={() => runAction("Archive", () => archiveContentAction("MODULE", module.id))} className={buttonClass}>
              {pendingAction === "Archive" ? "Archiving..." : "Archive"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
