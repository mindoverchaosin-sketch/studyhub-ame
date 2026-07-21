import type { Product, Price, Order, OrderItem, Coupon, Discount, SubscriptionPlan, Purchase, Entitlement, AccessPolicy, Bundle } from "@/types/domain/commerce";

export interface CommerceRepository {
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  getPrices(productId: string): Promise<Price[]>;
  getOrders(userId: string): Promise<Order[]>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  getCoupons(): Promise<Coupon[]>;
  getDiscounts(orderId: string): Promise<Discount[]>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getPurchases(userId: string): Promise<Purchase[]>;
  getEntitlements(userId: string): Promise<Entitlement[]>;
  getAccessPolicies(resourceId: string): Promise<AccessPolicy[]>;
  getBundles(): Promise<Bundle[]>;
}
