# 003 - Content Access

## Overview
This document describes how learning content is exposed to users and how access is controlled.

## Current direction
- Content is organized into modules, lessons, quizzes, and study resources.
- Students should be able to browse modules, open lesson detail views, and track progress.
- Content access should be role-aware and eventually tied to enrollment or subscription state.

## Proposed flow
1. A student opens the modules or dashboard experience.
2. The system loads the available content for the active user.
3. Progress is recorded per module and lesson.
4. Locked or premium content can be surfaced with clear state and messaging.

## Implementation notes
- Keep content components data-source agnostic so they can later be backed by Prisma or an API.
- Separate UI from access rules so premium logic can be layered in without changing the entire screen structure.
