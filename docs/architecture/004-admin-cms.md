# 004 - Admin CMS

## Overview
The admin experience is now structured around a reusable layout shell, placeholder route pages, and mock-backed data so future CRUD and publishing work can be layered in without touching Prisma.

## Current structure
- Admin layouts live under the admin route group and reuse a shared shell composed of a sidebar, navbar, breadcrumbs, and content area.
- Placeholder pages exist for dashboard, modules, lessons, materials, quizzes, mock tests, products, orders, students, analytics, and settings.
- The modules experience now includes a premium admin table, mock-backed filters/search, bulk actions, and a multi-step wizard.
- Mock data is served through the services and repositories layers to keep UI components data-source agnostic.

## Architectural decisions
- Keep the UI layer free of hardcoded content by moving mock data into lib/mock and service layers.
- Keep route pages thin and delegate to reusable admin components.
- Preserve a clean presentation → feature → service → repository flow for future Prisma-backed implementation.
- Keep pricing and payments out of the module domain; use product mapping as a future placeholder abstraction.
