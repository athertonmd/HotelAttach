# @hci/shared-types

Shared TypeScript type definitions for the Hotel Compliance Intelligence platform.

## Purpose

This package provides the canonical TypeScript interfaces, enums and value objects used across all HCI services. It ensures type consistency and prevents drift between bounded contexts.

## Contents

- **Domain entities** — Traveller, Trip, PNR, Segment, HotelBooking, Opportunity, Communication
- **Enums** — TripStatus, SegmentType, OpportunityType, OpportunityPriority, ReconciliationState, CoverageStatus, etc.
- **Value objects** — TenantId, CorporateId, CorrelationId, CausationId
- **Common types** — AuditFields, PaginatedResponse, ApiError

## Governance

All types must trace back to:

- Architecture & Integration Guide (bounded contexts, database ownership)
- Business Rules Catalogue (decision outputs, rule references)
- Project specifications (domain models, database designs)
- JSON event schemas in `/schemas`

## Usage

```typescript
import { Trip, TripStatus, TenantId } from '@hci/shared-types';
```

## Rules

1. Do not add types that belong to a single bounded context — those stay in the owning service.
2. Every type must reference the source document or schema it derives from.
3. Breaking changes require a version bump and downstream migration.
