# Integration Tests

End-to-end tests that validate cross-service event flows and business workflows.

These tests exercise the full event chain from ingestion through to opportunity closure, verifying that:

- Events flow correctly between bounded contexts
- Correlation IDs propagate through the entire chain
- Tenant isolation is maintained across service boundaries
- Business rules produce expected outcomes for known scenarios
