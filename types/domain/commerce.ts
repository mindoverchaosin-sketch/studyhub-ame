export type ProductType = "bundle" | "course" | "subscription" | "access-pack";
export type CurrencyCode = "INR" | "USD";
export type DiscountType = "percentage" | "fixed";
export type SubscriptionInterval = "monthly" | "quarterly" | "yearly";

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Price {
  id: string;
  productId: string;
  amount: number;
  currency: CurrencyCode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: "pending" | "paid" | "failed" | "refunded";
  currency: CurrencyCode;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface Discount {
  id: string;
  orderId?: string;
  couponId?: string;
  amount: number;
  description: string;
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  interval: SubscriptionInterval;
  priceId: string;
  isActive: boolean;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  orderId?: string;
  purchasedAt: string;
  expiresAt?: string;
}

export interface Entitlement {
  id: string;
  userId: string;
  resourceId: string;
  source: "purchase" | "bundle" | "subscription" | "admin" | "promotion";
  grantedAt: string;
  expiresAt?: string;
}

export interface AccessPolicy {
  id: string;
  resourceId: string;
  policyType: "free" | "purchase" | "bundle" | "subscription" | "admin" | "promotion";
  description: string;
}

export interface Bundle {
  id: string;
  slug: string;
  name: string;
  productIds: string[];
  isActive: boolean;
}
