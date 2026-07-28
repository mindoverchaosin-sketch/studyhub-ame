# Admin Portal Foundation

## Overview

Milestone 14 Phase 1 establishes the foundation for the enterprise admin portal. The dashboard is intentionally scoped to operational visibility and administration entry points without introducing payments, subscriptions, or billing modules.

## Architecture

The admin dashboard follows the existing layered architecture:

- UI: admin page components rendered through the admin layout
- Server actions: admin-specific entry points protect access with requireAdmin()
- Services: AdminDashboardService aggregates counts and health information
- Repositories: repositories remain the only layer that reads from Prisma

## Services

### AdminDashboardService

The service is implemented in server/services/admin-dashboard.service.ts.

It uses repository-based reads for:
- student counts
- module counts
- question counts
- mock exam counts
- exam attempt counts

It also reuses the health service so the dashboard can present system health without introducing a new operational layer.

## DTOs

The dashboard response is represented by server/application/dto/admin-dashboard.dto.ts.

It includes:
- summaryCards for the KPI tiles
- sections for overview, learning, student, content, system, and quick action grouping
- health metadata for status and version information

## Future Modules

The foundation is designed to expand into:
- Student Management
- Content Management
- Question Management
- Billing
- Analytics
- Audit Logs

The current phase intentionally leaves billing and subscriptions out of scope.

## Study Material Management

Phase 3B adds a lightweight study-material management layer for admin users. It is scoped to module-level administration and does not alter student-facing learning behavior.

### Architecture

- UI: module detail views render a resource table through the admin module experience
- Server actions: admin-only actions call into the study-material service
- Services: StudyMaterialManagementService returns DTOs only
- Repositories: ResourceRepository remains the only Prisma access layer

### DTOs

The service returns resource DTOs built from the existing Prisma StudyMaterial model. These DTOs carry:
- title
- description
- type
- url
- status
- creation and update timestamps

### Publishing Model

Resources support draft, published, and archived states. Publishing is represented through the service layer and does not introduce a versioning workflow.

### Ordering Model

Resources can be reordered within a module using a numeric displayOrder value stored in the repository.

## Publishing Workflow

Phase 3D introduces a centralized publishing workflow for modules, study materials, and questions. The workflow is intentionally scoped to the existing Prisma lifecycle fields and uses the service layer to coordinate status transitions without introducing billing, analytics, notifications, or scheduling behavior.

### Supported Lifecycle States

The workflow supports:
- Draft
- In Review
- Published
- Archived

The current Prisma schema already supports Draft, Published, and Archived through the shared Status enum, and the workflow uses the existing publishedAt field for publication timestamps. The workflow reserves an In Review state in the service layer for admin editorial flow while keeping persistence aligned with the schema.

### Service Architecture

- UI: admin detail views expose publishing controls and current status badges
- Server actions: publishing actions require requireAdmin() and revalidate the admin views
- Services: PublishingService centralizes submitForReview, approve, reject, publish, unpublish, and archive transitions
- Repositories: ModuleRepository, ResourceRepository, and QuestionRepository remain the only Prisma access layer

### Lifecycle Diagram

```text
Draft -> In Review -> Published
  \-> Archived
  \-> Draft (after rejection or unpublish)
```

### Future Evolution

The current implementation leaves room for future schema evolution:
- scheduling support can be added later when the schema exposes dedicated publish scheduling fields
- version history support can be added later once the schema has a first-class content-version model
- audit logs and richer RBAC remain future work and are not introduced in this phase

## Question Bank Management

Phase 3C.1 introduces an admin-only question bank management experience.

### Architecture

- UI: the admin questions workspace renders a question directory and editor panel
- Server actions: create, update, archive, and detail retrieval actions require requireAdmin()
- Services: QuestionManagementService validates and returns DTO-shaped results
- Repositories: QuestionRepository and QuestionBankRepository remain the only Prisma access layer

### DTOs

The service returns question DTOs containing:
- prompt/question text
- options
- correct answer mapping
- explanation
- difficulty
- question bank association
- status and metadata

### Validation Rules

Question create and edit operations validate:
- question text is required
- at least one option is required
- at least one correct answer must be selected
- duplicate options are rejected
- a valid question bank reference is required
- difficulty must be one of BEGINNER, INTERMEDIATE, or ADVANCED

### Bulk Operations and CSV Workflow

Phase 3C.2 adds a bulk management experience for the question bank. Admins can:
- select one, select the current page, or select all filtered results
- archive or restore selected questions
- change module or difficulty in bulk
- update tags in bulk
- import questions from CSV and review validation feedback
- export filtered questions to CSV

### CSV Format

The CSV import/export workflow uses a simple row-based format:

```csv
question,options,correct_answer,difficulty,module,status
What is hydraulics?,A|B|C|D,A,BEGINNER,Airframes,DRAFT
```

Required validation checks:
- question text is required
- at least two options are required
- duplicate options are rejected
- a correct answer is required
- difficulty must be BEGINNER, INTERMEDIATE, or ADVANCED
- the module must reference an existing question bank
- duplicate questions are rejected when already present in the selected bank

### Bulk Workflow

Bulk actions run through the admin-only server action layer and return a DTO-shaped summary containing:
- success count
- failure count
- validation errors

Import operations are handled transactionally where practical by submitting the valid rows in one repository transaction and surfacing any row-level validation issues in the UI summary.
