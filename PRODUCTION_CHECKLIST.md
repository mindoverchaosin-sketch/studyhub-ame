# Production Checklist

## Security

- [ ] Secrets are stored outside the repository.
- [ ] Production environment variables are configured correctly.
- [ ] HTTPS is enforced for public traffic.
- [ ] Authentication secrets are rotated before launch.
- [ ] Access control and authorization rules are reviewed.

## Performance

- [ ] Build completes successfully.
- [ ] Application responds within acceptable latency targets.
- [ ] Cache is enabled for repeated workload patterns.
- [ ] Large database queries are avoided in request paths.

## Caching

- [ ] Cache behavior is understood and documented.
- [ ] Cache invalidation paths are reviewed.
- [ ] Cache metrics are monitored for unusual hit or miss patterns.

## Logging

- [ ] Structured logs are emitted without leaking secrets.
- [ ] Log correlation identifiers are available for request tracing.
- [ ] Error logs are reviewed regularly.

## Metrics

- [ ] `/api/metrics` is reachable in production.
- [ ] Request and service metrics are understood.
- [ ] Cache metrics are reviewed for regressions.

## Health endpoint

- [ ] `/api/health` returns a healthy or degraded status as expected.
- [ ] Database checks fail gracefully without exposing internals.
- [ ] The endpoint is included in deployment validation.

## Database backups

- [ ] Automated backups are configured.
- [ ] Restore procedures are tested.
- [ ] Backup retention is documented.

## Monitoring

- [ ] Uptime monitoring is configured.
- [ ] Error alerts are configured.
- [ ] Resource utilization is tracked.

## Secrets

- [ ] Production secrets are rotated and managed centrally.
- [ ] No credentials are stored in code, logs, or artifacts.

## SSL

- [ ] TLS certificates are installed and valid.
- [ ] Redirects from HTTP to HTTPS are configured.

## Environment configuration

- [ ] Environment files or platform settings match the intended production values.
- [ ] Database, auth, and host settings are verified.
- [ ] `.env.example` exists and production secrets are stored out of repository.
- [ ] Runtime configuration validation is available and passes in deployment.

## Dependency audit

- [ ] Known vulnerabilities are reviewed before release.
- [ ] Deprecated packages are tracked for follow-up upgrades.
