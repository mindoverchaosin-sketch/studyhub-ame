# Deployment Guide

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A PostgreSQL-compatible database reachable from the runtime environment
- Access to environment variables for the production deployment target
- A process manager or container runtime capable of starting the Next.js application

## Environment variables

Required or recommended variables:

- NODE_ENV=production
- DATABASE_URL: PostgreSQL connection string for Prisma
- NEXTAUTH_SECRET: secret used by NextAuth
- NEXTAUTH_URL: public base URL for the application
- PORT: optional port override for the runtime

Security note:
- Do not commit secrets.
- Rotate secrets before production rollout.
- Inject secrets via the deployment platform or secret manager.

## Database migration process

1. Ensure the production database is reachable.
2. Run the Prisma migration workflow in the deployment environment.
3. Verify the migration completed successfully before exposing the application broadly.

Example commands:

```bash
npx prisma migrate deploy
```

## Environment validation

Before build or deploy, validate runtime configuration using the included environment validator.

```bash
npm run check:env
```

## Build commands

```bash
npm ci
npm run build
```

For the standalone output, deploy the generated `.next/standalone` directory together with the static assets:

```bash
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

## Production start commands

```bash
npm run start
```

This runs:

```bash
node .next/standalone/server.js
```

If the runtime requires a custom port:

```bash
PORT=3000 node .next/standalone/server.js
```

The production process must run from the directory containing `.next/standalone/server.js`. Do not use `next start` with `output: 'standalone'`.

## Rollback strategy

1. Stop or drain the unhealthy release.
2. Restore the previous deployment artifact or image.
3. Re-run the previous database migration state if necessary.
4. Verify health and metrics endpoints before resuming traffic.

## Upgrade process

1. Review release notes and deployment changes.
2. Run dependency installation and build validation in a staging environment.
3. Apply database migrations.
4. Deploy the new build.
5. Verify `/api/health` and `/api/metrics` before full rollout.

## Dependency review recommendations

- Keep `next`, `react`, `react-dom`, `prisma`, and `next-auth` on supported release lines.
- Review Node.js compatibility before major upgrades.
- Audit dependencies periodically for deprecations and security advisories.
- Prefer pinned or lockfile-controlled installs in production.
