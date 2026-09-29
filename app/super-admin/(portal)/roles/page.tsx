import SuperAdminPageHeader from "@/components/super-admin/SuperAdminPageHeader"
import RolePermissionMatrix from "@/components/super-admin/RolePermissionMatrix"
import { getPermissionMatrix } from "@/server/services/authorization.service"

export default function SuperAdminRolesPage() {
  return (
    <div>
      <SuperAdminPageHeader title="Roles & permissions" description="A read-only view of the application's current server-side permission matrix." />
      <p className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950">This view documents existing authorization rules. It does not change roles or grant permissions.</p>
      <RolePermissionMatrix matrix={getPermissionMatrix()} />
    </div>
  )
}