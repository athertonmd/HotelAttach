# @hci/validation

JSON Schema validation utilities and input validation helpers for the HCI platform.

## Purpose

This package provides:

- **Schema validation** — Ajv-based validation against JSON schemas in `/schemas`
- **Event validation** — validate event payloads against their declared schema before publishing
- **Input validation** — validate API request bodies, query parameters, and path parameters
- **Error formatting** — consistent validation error responses across all services

## Design

- Uses Ajv (Another JSON Schema Validator) with format support
- Schemas are loaded from the `/schemas` directory at build time
- Validation functions return typed results (valid payload or structured errors)
- All validation errors include the field path, expected type, and received value

## Usage

```typescript
import { validateEvent, validateInput } from '@hci/validation';

const result = validateEvent('PNRCreated', payload);
if (!result.valid) {
  console.error(result.errors);
}
```

## Governance

- Validation schemas must match the authoritative JSON schemas in `/schemas`
- No service should implement its own schema validation — use this package
- Validation errors must be logged with correlation IDs for traceability
