# 002 - Authentication

## Overview
Authentication is handled through a credentials-based NextAuth flow with JWT sessions and role-aware routing.

## Current approach
- Use NextAuth Credentials provider for login and registration.
- Store session state in JWT format for lightweight access control.
- Protect student and admin routes with middleware or route-level checks.

## Expected behavior
- Users can sign in, sign out, and access protected areas based on their role.
- Role-based redirects should send students to the student experience and admins to the admin experience.
- Authentication configuration should rely on environment variables such as AUTH_SECRET and DATABASE_URL.

## Future considerations
- Add password reset and email verification flows.
- Support social providers if the product expands beyond credentials.
- Introduce stricter session refresh and token rotation policies.
