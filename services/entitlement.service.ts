import type { Entitlement } from "@/types/domain/commerce";

export interface EntitlementService {
  listEntitlements(userId: string): Promise<Entitlement[]>;
  grantEntitlement(entitlement: Entitlement): Promise<void>;
  revokeEntitlement(entitlementId: string): Promise<void>;
}
