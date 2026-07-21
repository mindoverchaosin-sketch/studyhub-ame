# 008 - Domain Model

## Overview
This document captures the current domain model direction for the admin module management experience.

## Module concepts
- A module represents a discrete learning unit within the StudyHub curriculum.
- Each module contains metadata such as title, slug, module number, difficulty, access level, and status.
- Modules can eventually reference products for access control without storing pricing directly on the module itself.

## Architectural direction
- The module domain is modeled in a type-safe way in the shared types layer.
- UI components consume typed module data from services and mock repositories.
- Prisma and persistence details remain intentionally out of scope for this milestone.
