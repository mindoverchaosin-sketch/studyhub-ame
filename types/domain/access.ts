export interface AccessGrant {
  id: string;
  userId: string;
  resourceId: string;
  grantType: "free" | "purchase" | "bundle" | "subscription" | "admin" | "promotion";
  sourceId?: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface AccessCheckResult {
  hasAccess: boolean;
  reason: "free" | "purchased" | "bundle" | "subscription" | "admin" | "promotion" | "denied";
  resourceId: string;
}
