# Repository Pattern — Itinerary Intelligence Platform

## Overview

Repositories define the persistence boundary between domain logic and data storage. Application services depend only on repository interfaces (ports), never on concrete implementations.

## Pattern

```
Application Service → Repository Interface (port) → Implementation (adapter)
```

## Implementations

| Implementation               | Use Case                       |
| ---------------------------- | ------------------------------ |
| `InMemory*Repository`        | Unit tests, local development  |
| `Aurora*Repository` (future) | Production — Aurora PostgreSQL |

## Tenant Isolation

All repository methods require `tenantId` as the first parameter. Data cannot be accessed across tenants. This is enforced at the repository level regardless of implementation.

## Optimistic Version Checking

PNR and Segment repositories support optimistic versioning:

- Pass `expectedVersion` to `save()` to enforce version checks
- If the stored version differs from expected, `VersionConflictError` is thrown
- This prevents lost updates when concurrent writes occur

## Timeline Event Immutability

Timeline events are append-only. The `TimelineEventRepository` provides only `append()` — no update or delete operations exist. Duplicate appends (same eventId) are idempotent no-ops.

## Future Aurora PostgreSQL Implementation

When implementing the production database adapter:

- Use the `pnr_ingestion` schema within the shared Aurora cluster (Approved Decision Q4)
- Enforce tenant isolation via `WHERE tenant_id = $1` on all queries
- Use PostgreSQL advisory locks or `WHERE version = $expected` for optimistic versioning
- Use `INSERT ... ON CONFLICT DO NOTHING` for timeline event idempotency
- No service may write to another service's schema (Architecture Guide §9)
- Cross-service data access must use events, APIs, or read-model projections

## No Cross-Service Database Access

Per Architecture & Integration Guide §9:

- Each bounded context owns its own database tables
- Other services must NOT directly write to this service's tables
- Read access from other services must use published events, service APIs, or read models
