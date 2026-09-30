"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FiPlus, FiX } from "react-icons/fi"
import { createPrivilegedUserAction, type CreatePrivilegedUserResult } from "@/server/actions/user-management.actions"
import type { PrivilegedUserRole } from "@/server/services/user-management.service"

type ActionError = Extract<CreatePrivilegedUserResult, { success: false }>

const roleOptions: Array<{ value: PrivilegedUserRole; label: string; description: string }> = [
  { value: "ADMIN", label: "Admin", description: "Platform operations and administration" },
  { value: "CONTENT_EDITOR", label: "Content Editor", description: "Course and learning content workflows" },
  { value: "INSTRUCTOR", label: "Instructor", description: "Teaching tools, subject to instructor approval" },
]

export default function AddUserDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [role, setRole] = useState<PrivilegedUserRole>("ADMIN")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [department, setDepartment] = useState("")
  const [bio, setBio] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<ActionError | null>(null)
  const [success, setSuccess] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal()
      else dialog.setAttribute("open", "")
    }
  }, [isOpen])

  function resetForm() {
    setRole("ADMIN")
    setFullName("")
    setEmail("")
    setTemporaryPassword("")
    setDepartment("")
    setBio("")
    setIsActive(true)
    setShowPassword(false)
    setError(null)
  }

  function closeDialog() {
    if (pending) return
    setIsOpen(false)
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const roleLabel = roleOptions.find((option) => option.value === role)?.label ?? role
    if (!window.confirm(`Create this ${roleLabel} account for ${email.trim()}?`)) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await createPrivilegedUserAction({
          fullName,
          email,
          temporaryPassword,
          isActive,
          role,
          ...(role === "ADMIN" ? { department } : {}),
          ...(role === "INSTRUCTOR" ? { bio } : {}),
        })

        if (!result.success) {
          setError(result)
          return
        }

        const createdName = result.user.displayName ?? result.user.email
        setSuccess(`${createdName} was created as ${roleOptions.find((option) => option.value === result.user.role)?.label ?? result.user.role}.`)
        resetForm()
        setIsOpen(false)
        router.replace("/super-admin/users")
        router.refresh()
      } catch {
        setError({ success: false, code: "SERVER_ERROR", message: "The user could not be created. Please try again." })
      }
    })
  }

  const fieldError = (field: string) => error?.fieldErrors?.[field]?.[0]

  return (
    <>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => { setSuccess(""); setError(null); setIsOpen(true) }}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <FiPlus aria-hidden="true" className="h-4 w-4" />
          Add User
        </button>
        {success ? <p role="status" className="basis-full rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</p> : null}
      </div>

      {isOpen ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="add-user-title"
          onCancel={(event) => { event.preventDefault(); closeDialog() }}
          className="m-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-md border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/50"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-800">Platform accounts</p>
              <h2 id="add-user-title" className="mt-1 text-xl font-semibold">Add User</h2>
              <p className="mt-1 text-sm text-slate-600">Create an account with an existing platform role.</p>
            </div>
            <button type="button" aria-label="Close Add User dialog" disabled={pending} onClick={closeDialog} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50">
              <FiX aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          <form aria-label="Create privileged user" onSubmit={submit} className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            {error ? (
              <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                <p className="font-semibold">{{
                  UNAUTHENTICATED: "Sign-in required",
                  FORBIDDEN: "Permission denied",
                  INVALID_INPUT: "Invalid input",
                  DUPLICATE_EMAIL: "Email already in use",
                  SERVER_ERROR: "Creation failed",
                }[error.code]}</p>
                <p className="mt-1">{error.message}</p>
              </div>
            ) : null}

            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as PrivilegedUserRole)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <span className="text-xs font-normal text-slate-500">{roleOptions.find((option) => option.value === role)?.description}</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" error={fieldError("fullName")}>
                <input autoFocus required minLength={2} maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className={inputClass} />
              </Field>
              <Field label="Email" error={fieldError("email")}>
                <input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={inputClass} />
              </Field>
            </div>

            {role === "ADMIN" ? (
              <Field label="Department" optional error={fieldError("department")}>
                <input maxLength={120} value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass} />
              </Field>
            ) : null}
            {role === "INSTRUCTOR" ? (
              <Field label="Instructor bio" optional error={fieldError("bio")}>
                <textarea rows={3} maxLength={2000} value={bio} onChange={(event) => setBio(event.target.value)} className={`${inputClass} resize-y py-2`} />
              </Field>
            ) : null}

            <Field label="Temporary password" error={fieldError("temporaryPassword")}>
              <input required type={showPassword ? "text" : "password"} minLength={8} maxLength={72} value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} autoComplete="new-password" className={inputClass} />
              <span className="text-xs font-normal text-slate-500">Minimum 8 characters. The password is hashed before storage; share it securely with the user.</span>
            </Field>

            <label className="grid gap-1.5 text-sm font-medium text-slate-800">
              Account status
              <select value={isActive ? "ACTIVE" : "SUSPENDED"} onChange={(event) => setIsActive(event.target.value === "ACTIVE")} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
              {role !== "CONTENT_EDITOR" ? <span className="text-xs font-normal text-slate-500">This account will still require its existing {role === "ADMIN" ? "Admin" : "Instructor"} approval before role access is granted.</span> : null}
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
              Show temporary password
            </label>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" disabled={pending} onClick={closeDialog} className="min-h-10 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={pending} className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{pending ? "Creating…" : "Create user"}</button>
            </div>
          </form>
        </dialog>
      ) : null}
    </>
  )
}

const inputClass = "min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"

function Field({ label, optional, error, children }: { label: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      <span>{label}{optional ? <span className="ml-1 font-normal text-slate-500">(optional)</span> : null}</span>
      {children}
      {error ? <span className="text-xs font-normal text-rose-700">{error}</span> : null}
    </label>
  )
}