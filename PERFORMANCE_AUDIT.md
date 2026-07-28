# Performance Audit & Optimization

## Summary

This milestone focused on safe performance improvements without introducing new user-facing features or changing behavior. The work centered on eliminating avoidable database round-trips, reducing repeated calculations, and parallelizing independent service work.

## Optimizations Applied

### Repository audit
- Added batched lookup helpers for modules, lessons, questions, and exam attempt questions to avoid repeated single-record queries in hot paths.
- Kept repository boundaries intact; repositories remain the only layer touching Prisma.

### Service audit
- Replaced several per-item repository calls with batched retrieval and in-memory mapping.
- Parallelized independent data loading where it was safe and behavior-preserving.
- Reused loaded attempt context in exam analytics instead of reloading the same attempt data repeatedly.

### Dashboard optimization
- Dashboard summary now batches module lookups and attempt-question counting instead of issuing one query per module or attempt.
- Related detail lookups for lessons, modules, and courses now run in parallel.

### Mock exam optimization
- Exam analytics now reuses a single loaded attempt context across topic, difficulty, and time analytics calculations.
- Attempt scoring now batches question lookups instead of fetching each question individually.

### Adaptive learning optimization
- Adaptive learning review queue generation now resolves lesson and module details in batches rather than issuing individual repository calls per weak lesson.
- Continue-learning now loads module and lesson detail data in parallel.

## Queries Reduced

The following patterns were reduced:
- Module detail lookups: reduced from one query per module progress row to a single batched query for the needed module IDs.
- Lesson detail lookups: reduced from repeated per-item queries to batched retrieval in adaptive learning and continue-learning flows.
- Question lookups in exam analytics: reduced from one query per question to a single batched query for the question IDs in the attempt.
- Attempt-question counting: reduced from one query per attempt to a single batched query for all relevant attempt-question rows.

## Promise.all Opportunities Implemented

- Dashboard summary now fetches independent progress, streak, and adaptive-learning data in parallel.
- Continue-learning now resolves lesson and module detail lookups concurrently.
- Exam analytics now shares a single loaded attempt context across the three analytics sub-calculations.

## Remaining Optimization Opportunities

- Add more targeted Prisma selects/includes for frequently accessed relations where the full model shape is not needed.
- Review list endpoints and admin flows for additional pagination and count optimizations.
- Consider schema-level indexes on additional filter/sort combinations if query profiling shows hot spots.

## Suggested DB Indexes (Documentation Only)

The following indexes are worth reviewing once data volume grows:
- LessonProgress: `(userId, updatedAt)`
- ModuleProgress: `(userId, updatedAt)`
- QuizAttempt: `(userId, attemptedAt)`
- ExamAttempt: `(studentId, createdAt)`
- ExamAttemptQuestion: `(attemptId, displayOrder)`
- ExamAttemptAnswer: `(attemptQuestionId, answeredAt)`
