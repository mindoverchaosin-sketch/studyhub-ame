# Health Checks

## Endpoint

GET /api/health

## Response format

The endpoint returns a JSON payload with:

- status: healthy or degraded
- timestamp: ISO-8601 timestamp
- uptime: process uptime in seconds
- version: application version
- environment: runtime environment
- checks: database, cache, and application health state

Example:

```json
{
  "status": "healthy",
  "timestamp": "2026-07-25T00:00:00.000Z",
  "uptime": 42.5,
  "version": "0.1.0",
  "environment": "development",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "application": "healthy"
  }
}
```

## Health checks performed

- Database: performs a lightweight `SELECT 1` probe with a short timeout.
- Cache: checks the in-memory cache service availability without clearing it.
- Application: reports uptime, timestamp, version, Node.js version, and environment.

## Expected HTTP status codes

- 200: healthy
- 503: degraded health

## Future extensions

- Add readiness and liveness endpoints.
- Add dependency-specific checks for external services.
- Add metrics and alerting integration.

## Operational usage

Use the endpoint for basic operational readiness checks in deployment pipelines and load balancers.
