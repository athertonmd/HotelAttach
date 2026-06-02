# HCI Platform — Tests

This directory contains cross-service test suites that validate platform-level behaviour.

## Test Categories

| Directory           | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `contract-tests`    | Validate event schemas match between publishers and consumers |
| `integration-tests` | End-to-end flows across multiple services                     |
| `fixtures`          | Shared test data, mock events, sample payloads                |

## Contract Tests

Contract tests ensure that:

- Published events conform to their declared JSON schemas
- Consumer expectations match publisher outputs
- Schema changes are detected before deployment
- Event envelope structure is always valid

## Integration Tests

Integration tests validate:

- PNR → Trip → Segment creation flow
- Hotel booking → Reconciliation → Coverage flow
- Trip → Opportunity detection → Scoring flow
- Opportunity → Communication → Response flow
- End-to-end correlation ID propagation
- Tenant isolation across service boundaries

## Fixtures

Shared test data including:

- Sample PNR payloads (Mantic Point format)
- Canonical event fixtures for each event type
- Multi-tenant test data sets
- Edge case scenarios (out-of-order events, partial data, etc.)

## Running Tests

```bash
# Run all tests (unit + integration)
pnpm test

# Run contract tests only
pnpm --filter ./tests/contract-tests test

# Run integration tests only
pnpm --filter ./tests/integration-tests test
```

## Sources

- Architecture & Integration Guide §20 (Definition of Done)
- Architecture & Integration Guide §7 (Shared Event Schema Rules)
