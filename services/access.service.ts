import type { AccessCheckResult, AccessGrant } from "@/types/domain/access";

export interface AccessService {
  hasAccess(resourceId: string, userId: string): Promise<AccessCheckResult>;
  grantAccess(grant: AccessGrant): Promise<void>;
  revokeAccess(resourceId: string, userId: string): Promise<void>;
}
