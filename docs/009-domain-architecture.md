# 009 - Domain Architecture

## Purpose
This document defines the high-level domain boundaries for StudyHub before any persistence or UI implementation occurs.

## Responsibilities
- The content domain owns courses, modules, lessons, study materials, quizzes, mock tests, questions, and metadata such as tags and categories.
- The commerce domain owns products, prices, orders, subscriptions, purchases, entitlements, access policies, bundles, and discounts.
- The identity domain owns users, students, admins, roles, permissions, notifications, sessions, and audit logs.
- The learning domain owns enrollments, progress, quiz attempts, bookmarks, streaks, achievements, and certificates.

## Relationships
- Content is referenced by commerce through access policies and product mapping rather than direct pricing ownership.
- Identity and learning are connected through user participation and progress tracking.
- Commerce and access are connected through entitlements and access grants.

## Why this architecture was chosen
The design keeps the domains loosely coupled so future features can evolve independently without introducing circular dependencies.
