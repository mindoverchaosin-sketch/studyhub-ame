# 012 - Learning Domain

## Purpose
This document describes the learning-focused domain objects that track learner progress and outcomes.

## Responsibilities
- Enrollments represent a student joining a course.
- Progress and lesson/module progress capture completion signals.
- Quiz and mock test attempts record outcomes and scoring data.
- Bookmarks, streaks, achievements, and certificates support engagement and motivation loops.

## Relationships
- Learning objects are connected to users through identity and to content through course, module, lesson, quiz, and mock test IDs.
- This domain can evolve independently of commerce and content because it relies on stable IDs and typed interfaces.

## Future expansion
- Certificates can be introduced later without restructuring the core model.
- Additional analytics objects can be added as the product matures.
