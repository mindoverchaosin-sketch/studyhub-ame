# AeroPrep Architecture

Version: 1.0

Author: AeroPrep Engineering Team

---

# Vision

AeroPrep is a premium learning platform designed specifically for Aircraft Maintenance Engineering students preparing for DGCA and EASA Part-66 examinations.

The platform should feel like a modern SaaS application rather than a traditional education website.

Goals

- Beautiful UI
- Fast
- Secure
- Scalable
- Mobile First
- Easy to Maintain

---

# Architecture

Frontend

Next.js 16 App Router

Backend

Next.js Server Actions
Route Handlers

Database

PostgreSQL

ORM

Prisma

Authentication

Auth.js

Storage

Cloudinary

Deployment

Vercel

---

# Folder Structure

app/

components/

features/

lib/

hooks/

services/

constants/

types/

prisma/

public/

docs/

---

# Feature Based Development

Each feature owns its own components.

Example

features/

modules/

components/

hooks/

types/

services/

This prevents large messy projects.

---

# Component Rules

One responsibility per component.

Maximum 150-200 lines per component.

Extract repeated UI into reusable components.

Prefer composition over duplication.

---

# Naming

Components

PascalCase

ModuleCard.tsx

FeatureCard.tsx

Hooks

camelCase

useModules.ts

Functions

camelCase

Variables

camelCase

Constants

UPPER_CASE

---

# Styling

Tailwind CSS

No inline styles.

Use utility classes.

Extract repeated styles into reusable components.

---

# State Management

Server State

Server Components

Client State

React hooks

Global State

Only introduce Zustand when genuinely needed.

Avoid unnecessary global state.

---

# API

REST Style

/api/modules

/api/quizzes

/api/users

/api/auth

Every endpoint returns

success

message

data

errors

---

# Database Philosophy

Normalize data.

Avoid duplicate data.

Everything revolves around

Course

↓

Module

↓

Chapter

↓

Topic

↓

Lesson

↓

Resources

---

# Performance

Server Components by default.

Lazy load images.

Use Next Image.

Avoid unnecessary Client Components.

Optimize Lighthouse score.

Target

95+

---

# Accessibility

Semantic HTML

Keyboard Navigation

ARIA Labels

Proper Heading Structure

Color Contrast

---

# Security

Never trust client input.

Validate everything.

Use Zod.

Hash passwords.

Protect admin routes.

---

# Git Workflow

main

Stable

develop

Active development

feature/*

Individual features

---

# Documentation

Every major feature must include

Purpose

Architecture

Files Modified

Future Improvements

---

# Development Philosophy

Build reusable systems.

Never rush features.

Quality over quantity.

Every feature should be production ready.
