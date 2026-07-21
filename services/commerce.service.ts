import type { Product, Order, Coupon, SubscriptionPlan } from "@/types/domain/commerce";

export interface CommerceService {
  listProducts(): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  createOrder(order: Order): Promise<Order>;
  applyCoupon(code: string, orderId: string): Promise<Coupon | null>;
  getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null>;
}
