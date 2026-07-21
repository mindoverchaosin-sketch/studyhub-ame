import type { PermissionName } from "@/types/domain/identity";

export interface AuthorizationService {
  hasPermission(userId: string, permission: PermissionName): Promise<boolean>;
  canAccessResource(userId: string, resourceId: string): Promise<boolean>;
}
