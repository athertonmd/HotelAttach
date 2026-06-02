# @hci/event-contracts

Event envelope utilities, type definitions, and EventBridge abstractions for the HCI platform.

## Purpose

This package is the single source of truth for event contracts in code. It provides:

- **Event envelope type** — the standard wrapper all domain events must use
- **Event type constants** — string literal types for all approved event names
- **Event payload interfaces** — TypeScript types derived from JSON schemas
- **Event factory functions** — helpers to create correctly-shaped events with required fields
- **Publisher abstraction** — interface for publishing events to EventBridge
- **Consumer abstraction** — interface for subscribing to and handling events

## Event Envelope Standard

Every event published to EventBridge must include:

```json
{
  "eventId": "uuid",
  "eventType": "EventName",
  "occurredAt": "ISO-8601 UTC",
  "source": "service-name",
  "version": "1.0.0",
  "correlationId": "uuid",
  "causationId": "uuid",
  "tenantId": "uuid",
  "payload": {}
}
```

## Approved Event Types

### Project 1 — Itinerary Intelligence

- PNRCreated, PNRUpdated
- TripCreated, TripUpdated, TripCompleted
- SegmentAdded, SegmentUpdated, SegmentRemoved
- TravellerCreated, TravellerUpdated
- BookingCreated, BookingUpdated, BookingCancelled

### Project 2 — Booking Reconciliation

- HotelMatched, HotelRejected, HotelCoverageUpdated, HotelOrphanDetected, ReconciliationUpdated

### Project 3 — Opportunity Detection

- OpportunityCreated, OpportunityUpdated, OpportunityClosed, OpportunityEscalated

### Project 4 — Traveller Engagement

- CommunicationSent, TravellerResponded, BookingRequestCreated, OpportunityConverted

### Project 5 — Compliance Analytics Portal

- PolicyChanged, SupplierContractChanged

### Project 6 — Behavioural Intelligence (Post-MVP)

- RecommendationCreated, ConversionPredicted, SupplierRiskForecasted

## Governance

- No service may publish events not listed above without explicit approval.
- Event payloads must match the JSON schemas in `/schemas`.
- Breaking changes require a version bump in the envelope `version` field.

## Usage

```typescript
import { createEvent, EventType, PNRCreatedPayload } from '@hci/event-contracts';
```
