# 011 - Access Control

## Purpose
This document describes the generic access model used by StudyHub so the platform can answer a single question: does a user have access to a resource?

## Responsibilities
- The access model is resource-oriented and centered on the question hasAccess(resourceId).
- Access can come from free content, purchased products, bundles, subscriptions, admin grants, or future promotion-based access.
- Access decisions should be made through an access service, not through UI-specific checks such as didBuyModule().

## Relationships
- Access policies describe how access is granted.
- Entitlements represent granted access records.
- Commerce and identity contribute the evidence required to evaluate access.

## Why this architecture was chosen
A generic access model keeps content and commerce loosely coupled while ensuring every experience can evaluate access consistently.
