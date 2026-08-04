# CI/CD Guide

This document describes a recommended deployment pipeline for the project. It does not configure a specific provider.

## Recommended pipeline

1. Install dependencies
   - Run `npm ci`.
   - Ensure the lockfile is up to date.

2. Lint
   - Run `npm run lint`.
   - Address issues before deployment.

3. Environment validation
   - Run `npm run check:env`.
   - Ensure required runtime variables and provider settings are correct.

4. TypeScript
   - Run `npx tsc --noEmit`.
   - Ensure the typecheck is clean.

5. Unit tests
   - Run `npm run test:ci`.
   - Require passing tests before promotion.

5. Build
   - Run `npm run build`.
   - Confirm the production bundle compiles successfully.

6. Security audit
   - Review dependency advisories and runtime secret handling.
   - Confirm package versions are within supported ranges.

7. Deploy
   - Deploy the validated build artifact.
   - Validate `/api/health` and `/api/metrics` immediately after release.

## Release gates

- The build must pass.
- Tests must pass.
- TypeScript must pass.
- Deployment should be blocked on unresolved critical issues.
