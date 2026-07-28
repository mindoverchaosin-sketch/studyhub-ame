# Observability

## Executive Summary

This project now has a centralized structured logging foundation and request correlation support. Logs are emitted consistently from core service operations and request handlers, capturing request IDs, service names, operations, and execution timing. Sensitive data is excluded from logged payloads, and the format is designed for future integration with external observability systems.

## Logging Architecture

### Central logger

A reusable logger module exists at `lib/logger.ts`.

- `logger.debug()`
- `logger.info()`
- `logger.warn()`
- `logger.error()`
- `instrumentService(service, operation, callback)` wraps business operations for consistent lifecycle logs.

### Log levels

- `debug` — low-level diagnostic information for developers.
- `info` — normal operational events, service start/completion.
- `warn` — recoverable issues or unexpected but handled states.
- `error` — failed operations, unexpected exceptions.

### Structured log format

Logs are emitted as JSON objects with consistent properties:

- `timestamp`
- `level`
- `message`
- `service`
- `operation`
- `requestId`
- `durationMs`
- `errorType`
- `errorMessage`

This format supports automated parsing and correlation across services.

## Request Context

### Request IDs

Each HTTP request receives a correlation ID via `x-request-id`.

- Middleware generates or forwards a request ID.
- API route handlers use `withRequestLogging()` to bind that ID to the request lifecycle.
- Response headers propagate `x-request-id` back to callers.

### Correlation across services

The request ID is stored in `lib/request-context.ts` using `AsyncLocalStorage`. This allows service instrumentation to reuse the same request ID without passing it through every method explicitly.

## Service Instrumentation

### Instrumented services

The following services are instrumented with `instrumentService()`:

- `DashboardService`
- `AchievementService`
- `ProgressInsightsService`
- `StudyPlannerService`
- `ExamAttemptService`
- `ExamCompletionService`

### Logged events

Each instrumented service logs:

- `service.start`
- `service.complete`
- `service.error`

API routes log:

- `request.start`
- `request.complete`
- `request.error`

### Execution timing

Service instrumentation captures execution duration in `durationMs` for both successful and failed operations.

## Error Logging

### Expected behavior

Unexpected errors are logged with:

- `requestId`
- `service`
- `operation`
- `errorType`
- `errorMessage`

Handled failures are captured without exposing raw stack traces to users.

### Sensitive data policy

Logs avoid sensitive content. Error payloads include only error type and message, not authentication tokens, passwords, or personal profile data.

### Production vs development logging

- In production, logs remain JSON-formatted for structured ingestion.
- In development, the same JSON structure is written to the console for readability.

## Future Integrations

The current observability foundation is ready for future integrations:

- **OpenTelemetry** — add trace/span propagation and export to an OTLP collector.
- **Sentry** — capture errors and request context for application monitoring.
- **Datadog** — route structured logs into Datadog Logs and connect them to service performance metrics.
- **Prometheus** — while not implemented in this phase, the architecture can later support metrics export through a separate instrumentation layer.

## Best Practices

- Use the shared logger instead of `console.log()` in service and request code.
- Keep log payloads lean and avoid logging sensitive fields.
- Log start and end of service operations, not every loop iteration.
- Always propagate `x-request-id` for request correlation.
- Use `instrumentService()` for any major service entrypoint that performs business operations.
- Reserve `debug` for developer diagnostics and `error` for unexpected failures.
