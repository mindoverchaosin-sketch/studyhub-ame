"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  reactivateUserAccountAction,
  revokeAllUserSessionsAction,
  revokePrivilegedRoleAction,
  suspendUserIndefinitelyAction,
  suspendUserTemporarilyAction,
  terminateUserPermanentlyAction,
} from "@/server/actions/user-lifecycle.actions"
import type { UserManagementStatus } from "@/server/services/user-management.service"

type LifecycleAction = (formData: FormData) => Promise<void>
type LifecycleField = { name: "reason" | "suspensionEndsAt"; label: string; type: "text" | "datetime-local"; placeholder?: string }
type LifecycleControl = { label: string; confirmation: string; success: string; action: LifecycleAction; style: string; fields: LifecycleField[] }

export default function UserLifecycleControls({ userId, role, status }: { userId: string; role: string; status: UserManagementStatus }) {
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const router = useRouter()

  const controls: LifecycleControl[] = [
    ...(status === "ACTIVE" ? [
      {
        label: "Suspend Temporarily",
        confirmation: "Suspend this account temporarily?",
        success: "Temporary suspension completed.",
        action: suspendUserTemporarilyAction,
        style: "bg-amber-600",
        fields: [
          { name: "reason" as const, label: "Reason", type: "text" as const, placeholder: "Reason" },
          { name: "suspensionEndsAt" as const, label: "Suspension end", type: "datetime-local" as const },
        ],
      },
      {
        label: "Suspend Indefinitely",
        confirmation: "Suspend this account indefinitely?",
        success: "Indefinite suspension completed.",
        action: suspendUserIndefinitelyAction,
        style: "bg-amber-700",
        fields: [{ name: "reason" as const, label: "Reason", type: "text" as const, placeholder: "Reason" }],
      },
    ] : []),
    ...(status === "SUSPENDED" ? [{
      label: "Reactivate",
      confirmation: "Reactivate this account?",
      success: "Account reactivation completed.",
      action: reactivateUserAccountAction,
      style: "bg-emerald-700",
      fields: [{ name: "reason" as const, label: "Reactivation reason", type: "text" as const, placeholder: "Reactivation reason" }],
    }] : []),
    ...(role !== "STUDENT" && role !== "SUPER_ADMIN" && status !== "TERMINATED" ? [{
      label: "Revoke Privileged Role",
      confirmation: "Revoke this privileged role?",
      success: "Privileged role revocation completed.",
      action: revokePrivilegedRoleAction,
      style: "bg-slate-700",
      fields: [{ name: "reason" as const, label: "Reason", type: "text" as const, placeholder: "Reason" }],
    }] : []),
    ...(status !== "TERMINATED" ? [
      {
        label: "Terminate Permanently",
        confirmation: "This is permanent. Confirm termination of this account?",
        success: "Account termination completed.",
        action: terminateUserPermanentlyAction,
        style: "bg-rose-700",
        fields: [{ name: "reason" as const, label: "Termination reason", type: "text" as const, placeholder: "Termination reason" }],
      },
      {
        label: "Revoke All Sessions",
        confirmation: "Revoke all active sessions for this user?",
        success: "Session revocation completed.",
        action: revokeAllUserSessionsAction,
        style: "bg-slate-900",
        fields: [{ name: "reason" as const, label: "Reason", type: "text" as const, placeholder: "Reason" }],
      },
    ] : []),
  ]

  function submit(event: React.FormEvent<HTMLFormElement>, control: LifecycleControl) {
    event.preventDefault()
    if (!window.confirm(control.confirmation)) return

    const formData = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      try {
        await control.action(formData)
        setFeedback({ type: "success", message: control.success })
        router.refresh()
      } catch (error) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : "The account could not be updated.",
        })
      }
    })
  }

  return (
    <section className="mt-6 max-w-5xl rounded-md border border-slate-200 bg-white p-5" aria-label="Account controls">
      <h3 className="text-base font-semibold text-slate-950">Account controls</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={pending}>
        {controls.map((control) => (
          <form key={control.label} onSubmit={(event) => submit(event, control)} className="rounded-md border border-slate-200 p-3">
            <input type="hidden" name="userId" value={userId} />
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{control.label}</p>
            {control.fields.map((field) => (
              <label key={field.name} className="mb-2 grid gap-1 text-xs font-semibold text-slate-700">
                {field.label}
                <input
                  name={field.name}
                  type={field.type}
                  required
                  minLength={field.name === "reason" ? 4 : undefined}
                  placeholder={field.placeholder}
                  className="w-full rounded border border-slate-300 px-2 py-2 text-sm font-normal"
                />
              </label>
            ))}
            <button type="submit" disabled={pending} className={`w-full rounded-md px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50 ${control.style}`}>
              {pending ? "Working..." : control.label}
            </button>
          </form>
        ))}
      </div>
      {feedback ? <p role={feedback.type === "error" ? "alert" : "status"} className={`mt-4 text-sm ${feedback.type === "error" ? "text-rose-700" : "text-emerald-800"}`}>{feedback.message}</p> : null}
    </section>
  )
}