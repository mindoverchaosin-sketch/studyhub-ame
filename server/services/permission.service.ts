import { getPermissionMatrix, normalizeRoleName, type AppRole, type PermissionName } from './authorization.service'

export type CanonicalRole = AppRole

export class PermissionService {
  hasPermission(role: string | undefined, permission: PermissionName): boolean {
    const normalizedRole = normalizeRoleName(role)
    const canonicalPermissions = getPermissionMatrix()[normalizedRole] ?? []
    return canonicalPermissions.includes(permission)
  }

  hasRole(role: string | undefined, expectedRole: AppRole): boolean {
    return normalizeRoleName(role) === normalizeRoleName(expectedRole)
  }
}

export const permissionService = new PermissionService()
