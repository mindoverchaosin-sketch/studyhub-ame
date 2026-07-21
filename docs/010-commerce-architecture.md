# 010 - Commerce Architecture

## Purpose
This document describes the commerce domain architecture and how it integrates with content access without attaching pricing to content objects.

## Responsibilities
- Products represent purchasable or access-granting units.
- Prices describe currency and amount for a product.
- Orders and order items capture transactions.
- Coupons and discounts can reduce order totals.
- Subscription plans and purchases represent recurring or one-time access.
- Entitlements and access policies determine whether a user can access a resource.

## Relationships
- A product grants access to content indirectly through entitlements and policies.
- Content does not own price information.
- A bundle can group multiple products into a single access package.

## Future expansion
- Payment providers can be injected behind the commerce service interface without changing the domain model.
- Prisma can later store these models without introducing UI or service coupling.
