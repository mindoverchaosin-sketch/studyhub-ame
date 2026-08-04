# AeroPrep Release Checklist

## Release scope
- Release target: production deployment of the current AeroPrep build.
- Current verification status: build succeeded and the full test suite passed with 95 test files and 309 tests.

## Preconditions
- Confirm the deployment environment has Node.js 22.x and npm 10.x.
- Confirm access to the target PostgreSQL instance and the production connection string.
- Prepare the production environment variables:
  - NODE_ENV=production
  - DATABASE_URL
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET or AUTH_SECRET
  - AI_PROVIDER
  - OpenAI/Anthropic/Gemini credentials only when the chosen provider is enabled
- Ensure the deployment host can reach the database and outbound AI provider endpoints if those are enabled.

## Pre-deployment validation
1. Install dependencies: `npm ci`
2. Generate Prisma client: `npx prisma generate`
3. Validate runtime environment: `npm run check:env`
4. Run type-checking: `npx tsc --noEmit`
5. Build the application: `npm run build`
6. Run the regression suite: `npm run test:ci`

## Deployment steps
1. Apply database migrations in the target environment.
2. Deploy the application artifact or release package.
3. Start the application with the production environment loaded.
4. Confirm the health endpoint responds successfully.
5. Verify critical routes and authentication flows manually.

## Post-deployment verification
- `GET /api/health` should return a healthy status.
- `GET /api/metrics` should return metrics without runtime errors.
- Confirm login, student dashboard, and admin routes load as expected.
- Review logs for startup warnings, Prisma connection issues, or AI provider failures.

## Rollback plan
1. Stop the faulty release or scale down the unhealthy instance.
2. Restore the previous known-good deployment artifact.
3. Re-apply the prior database migration state if required.
4. Re-run health and metrics checks before resuming traffic.

## Troubleshooting
- If the app fails to start, verify that the required environment variables are present and valid.
- If Prisma authentication fails, verify the database credentials, host, and SSL settings.
- If AI routes fail, confirm the selected provider credentials and provider-specific environment variables.
- If the health endpoint degrades, inspect application logs and recent deployment changes.
