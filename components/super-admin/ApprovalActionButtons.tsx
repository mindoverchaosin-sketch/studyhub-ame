"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  approveAdminAction,
  approveInstructorAction,
  reactivateAdminAction,
  reactivateInstructorAction,
  rejectAdminAction,
  rejectInstructorAction,
  suspendAdminAction,
  suspendInstructorAction,
} from "@/server/actions/approval-management.actions"

type ApprovalKind = "admin" | "instructor"
type ApprovalState = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "UNKNOWN"
type ApprovalAction = (userId: string) => Promise<unknown>

const actionMap: Record<ApprovalKind, Record<string, { label: string; confirm: string; run: ApprovalAction; style: string }>> = {
  admin: {
    approve: { label: "Approve", confirm: "Approve this administrator account?", run: approveAdminAction, style: "bg-emerald-700 text-white hover:bg-emerald-800" },
    reject: { label: "Reject", confirm: "Reject this administrator application?", run: rejectAdminAction, style: "border border-rose-300 text-rose-800 hover:bg-rose-50" },
    suspend: { label: "Suspend", confirm: "Suspend this administrator's approval?", run: suspendAdminAction, style: "border border-rose-300 text-rose-800 hover:bg-rose-50" },
    reactivate: { label: "Reactivate", confirm: "Reactivate this administrator's approval?", run: reactivateAdminAction, style: "bg-emerald-700 text-white hover:bg-emerald-800" },
  },
  instructor: {
    approve: { label: "Approve", confirm: "Approve this instructor account?", run: approveInstructorAction, style: "bg-emerald-700 text-white hover:bg-emerald-800" },
    reject: { label: "Reject", confirm: "Reject this instructor application?", run: rejectInstructorAction, style: "border border-rose-300 text-rose-800 hover:bg-rose-50" },
    suspend: { label: "Suspend", confirm: "Suspend this instructor's approval?", run: suspendInstructorAction, style: "border border-rose-300 text-rose-800 hover:bg-rose-50" },
    reactivate: { label: "Reactivate", confirm: "Reactivate this instructor's approval?", run: reactivateInstructorAction, style: "bg-emerald-700 text-white hover:bg-emerald-800" },
  },
}

export default function ApprovalActionButtons({ userId, kind, status }: { userId: string; kind: ApprovalKind; status: ApprovalState }) {
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const router = useRouter()
  const actions = status === "APPROVED"
    ? [actionMap[kind].suspend]
    : status === "SUSPENDED"
      ? [actionMap[kind].reactivate]
      : [actionMap[kind].approve, actionMap[kind].reject]

  function run(action: (typeof actions)[number]) {
    if (!window.confirm(action.confirm)) return
    setFeedback(null)
    startTransition(async () => {
      try {
        await action.run(userId)
        setFeedback({ type: "success", message: `${action.label} completed.` })
        router.refresh()
      } catch (error) {
        setFeedback({ type: "error", message: error instanceof Error ? error.message : "The approval could not be updated." })
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <button key={action.label} type="button" disabled={pending} onClick={() => run(action)} className={`min-h-9 rounded-md px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 ${action.style}`}>
          {pending ? "Working..." : action.label}
        </button>
      ))}
      {feedback ? <p role={feedback.type === "error" ? "alert" : "status"} className={`basis-full text-xs ${feedback.type === "error" ? "text-rose-700" : "text-emerald-800"}`}>{feedback.message}</p> : null}
    </div>
  )
}