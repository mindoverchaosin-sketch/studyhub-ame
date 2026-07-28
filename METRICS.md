# Metrics

## Metrics collected

The application exposes lightweight in-memory metrics for operational monitoring.

- Request counters: total, successful, and failed requests
- Service execution counters: total executions and average duration
- Cache counters: hits, misses, and hit ratio
- Basic runtime metadata: uptime and timestamp

## Endpoint format

GET /api/metrics

Example response:

```json
{
  "requests": {
    "total": 12,
    "success": 10,
    "failed": 2
  },
  "services": {
    "executions": 24,
    "averageDurationMs": 14
  },
  "cache": {
    "hits": 18,
    "misses": 3,
    "hitRatio": 0.8571428571428571
  },
  "uptime": 123.45,
  "timestamp": "2026-07-25T00:00:00.000Z"
}
```

## Counter definitions

- requests.total: increments per request lifecycle
- requests.success: increments for completed requests
- requests.failed: increments for failed requests
- services.executions: increments for each service wrapper execution
- services.averageDurationMs: average duration across service executions
- cache.hits: increments when the cache returns a cached value
- cache.misses: increments when the cache does not return a cached value

## Performance considerations

- Metrics are stored in memory only.
- The implementation is intentionally lightweight and non-blocking.
- No external monitoring services or dependencies are introduced.

## Future integrations

- Prometheus
- OpenTelemetry
- Grafana
