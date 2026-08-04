# Production Runbook

## Application won't start

1. Review application logs for startup errors.
2. Confirm the runtime environment variables are present.
3. Verify the database connection string is valid.
4. Check whether the build artifact or dependencies were updated incorrectly.
5. Use `/api/health` to confirm whether the process is healthy.
6. Run `npm run check:env` in the deployment environment to confirm the runtime config is valid.

## Database unavailable

1. Confirm the database host, credentials, and network path.
2. Check whether the database service is running.
3. Review the health endpoint for a degraded or unhealthy database state.
4. Pause nonessential writes until the database recovers.
5. Coordinate with the database administrator if the outage persists.

## High error rate

1. Review recent application logs and error traces.
2. Check the metrics endpoint for request failures.
3. Confirm whether the issue is limited to a specific route or dependency.
4. Scale or restart the affected application instances if appropriate.
5. Roll back to the previous known-good deployment if error rates remain elevated.

## Slow responses

1. Review application logs and response timings.
2. Check cache hit and miss trends from `/api/metrics`.
3. Review database query volume and latency.
4. Inspect whether memory pressure or CPU saturation is affecting the runtime.
5. Roll back if performance degrades materially from baseline.

## Cache issues

1. Confirm cache health through the health endpoint and metrics output.
2. Review whether cache invalidation logic is causing stale or missing entries.
3. Inspect application logs for repeated cache-related errors.
4. Clear or restart the cache only if the deployment plan explicitly allows it.

## Rollback

1. Stop the faulty release.
2. Revert to the previous deployment artifact.
3. Re-run the last known-good build and migration state.
4. Confirm health and metrics endpoints return expected values.

## Log inspection

- Search logs for `service.error`, `request.error`, and startup failures.
- Correlate log entries with the request ID when available.
- Review logs before and after a deployment to isolate regressions.

## Health endpoint usage

- Use `GET /api/health` for basic readiness checks.
- Expect `200` for healthy and `503` for degraded health.

## Metrics endpoint usage

- Use `GET /api/metrics` to inspect request counts, service timings, and cache trends.
- Compare values before and after deployment changes.
