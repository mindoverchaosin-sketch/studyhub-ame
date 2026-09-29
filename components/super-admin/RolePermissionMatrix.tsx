import type { AppRole, PermissionMatrix, PermissionName } from "@/server/services/authorization.service"

const roles: Array<{ id: AppRole; label: string }> = [
  { id: "SUPER_ADMIN", label: "SUPER_ADMIN" },
  { id: "ADMIN", label: "ADMIN" },
  { id: "CONTENT_EDITOR", label: "CONTENT_EDITOR" },
  { id: "STUDENT", label: "STUDENT" },
  { id: "INSTRUCTOR", label: "INSTRUCTOR" },
]

const permissionLabels: Record<PermissionName, string> = {
  manageUsers: "Manage users",
  manageStudents: "Manage students",
  manageModules: "Manage modules",
  manageResources: "Manage resources",
  manageQuestions: "Manage questions",
  publishContent: "Publish content",
  viewAnalytics: "View platform analytics",
  manageBilling: "Manage billing",
  viewBillingAnalytics: "View billing analytics",
  manageInvoices: "Manage invoices",
  manageAuditLogs: "View audit logs",
  manageCourses: "Manage courses",
  manageLessons: "Manage lessons",
  viewOwnAnalytics: "View own analytics",
  accessAiTutor: "Access AI tutor",
  attemptMockTests: "Attempt mock tests",
  viewStudentContent: "View student content",
}

const permissions = Object.keys(permissionLabels) as PermissionName[]

export default function RolePermissionMatrix({ matrix }: { matrix: PermissionMatrix }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-[760px] divide-y divide-slate-200 text-left text-sm">
        <caption className="sr-only">Application permissions by user role</caption>
        <thead className="bg-slate-50">
          <tr><th scope="col" className="sticky left-0 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Permission</th>{roles.map((role) => <th scope="col" key={role.id} className="px-4 py-3 text-xs font-semibold text-slate-700">{role.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {permissions.map((permission) => (
            <tr key={permission}>
              <th scope="row" className="sticky left-0 bg-white px-4 py-3 font-medium text-slate-800">{permissionLabels[permission]}</th>
              {roles.map((role) => {
                const granted = matrix[role.id].includes(permission)
                return <td key={role.id} className="px-4 py-3 text-center"><span aria-label={`${role.label}: ${granted ? "granted" : "not granted"}`} className={granted ? "font-semibold text-emerald-800" : "text-slate-400"}>{granted ? "Granted" : "—"}</span></td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">INSTRUCTOR is included because it is also defined in the live permission matrix.</p>
    </div>
  )
}