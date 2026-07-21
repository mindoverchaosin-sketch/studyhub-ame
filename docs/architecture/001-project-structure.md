# 001 - Project Structure

## Overview
This document defines the high-level organization of the StudyHub platform and the responsibilities of the main folders.

## Top-level layout
- app/: route-level UI and server entry points using the App Router.
- components/: shared UI primitives and feature-specific presentational components.
- features/: domain-oriented modules such as auth, courses, quiz, admin, and marketing.
- lib/: shared utilities, helpers, and integration glue.
- server/: server actions, repositories, services, validators, and error handling.
- prisma/: schema and seed definitions.
- types/: shared TypeScript types for domain models.
- docs/: project documentation and architecture notes.

## Architecture principles
- Keep route components thin and delegate business logic to feature or server layers.
- Prefer reusable shared components over ad-hoc UI in page files.
- Keep data access logic in server-side modules rather than route components.
- Separate presentation from persistence so future Prisma or API integrations remain low risk.
