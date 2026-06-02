# @hci/observability

Structured logging, correlation ID management, and metrics for the HCI platform.

## Purpose

This package provides cross-cutting observability concerns shared by all HCI services:

- **Structured logging** — JSON-formatted logs compatible with CloudWatch Logs Insights
- **Correlation ID propagation** — ensures a single business workflow (e.g. PNR → Trip → Opportunity → Communication) can be traced end-to-end
- **Tenant context** — extracts and attaches tenantId to all log entries
- **Error handling** — consistent error logging with stack traces, context, and correlation
- **Metrics** — CloudWatch Embedded Metrics Format helpers for operational dashboards

## Log Format

```json
{
  "timestamp": "2026-05-31T10:00:00.000Z",
  "level": "INFO",
  "service": "booking-reconciliation",
  "correlationId": "uuid",
  "tenantId": "uuid",
  "message": "Hotel matched to trip",
  "data": { "tripId": "...", "confidence": 95 }
}
```

## Correlation ID Rules

1. `correlationId` is generated at the entry point (PNR ingestion webhook) and propagated through all downstream events.
2. Every event envelope carries `correlationId` and `causationId`.
3. Every log entry includes `correlationId`.
4. Every audit record includes `correlationId`.

## Usage

```typescript
import { createLogger, withCorrelation } from '@hci/observability';

const logger = createLogger('booking-reconciliation');
logger.info('Evaluating hotel match', { tripId, hotelId });
```

## Governance

- All services must use this package for logging — no custom logger implementations.
- Correlation IDs must never be dropped or regenerated mid-workflow.
- Logs must not contain PII beyond what is necessary for debugging (follow GDPR requirements).
