# HCI Platform Architecture & Integration Guide

## 1. Purpose

This document explains how the Hotel Compliance Intelligence (HCI) platform projects fit together as a coordinated event-driven platform.

It is intended for Kiro and development agents as the controlling architecture guide.

Kiro should use this document alongside the project specifications and JSON schemas. This guide defines:

- Bounded contexts
- Service responsibilities
- Event flows
- Shared schema usage
- Database ownership
- Integration rules
- Build sequence
- Implementation constraints

The goal is to prevent each project being implemented as an isolated application.

---

## 2. Platform Objective

The HCI platform helps TMCs and corporates identify, manage and recover hotel booking opportunities linked to business travel.

The platform must:

1. Ingest PNR, trip, traveller, segment and booking data.
2. Reconcile hotel bookings against trips.
3. Detect missing, partial or non-compliant hotel opportunities.
4. Engage travellers to resolve opportunities.
5. Provide operational analytics and compliance visibility.
6. Later optimise recovery using behavioural intelligence.

---

## 3. High-Level Platform Modules

The platform is composed of six major project areas.

| Project   | Service Area                                     | MVP Status |
| --------- | ------------------------------------------------ | ---------- |
| Project 1 | Core Itinerary / PNR / Trip / Segment Foundation | MVP        |
| Project 2 | Booking Reconciliation Engine                    | MVP        |
| Project 3 | Opportunity Detection Engine                     | MVP        |
| Project 4 | Traveller Engagement Platform                    | MVP        |
| Project 5 | Compliance Analytics Portal                      | MVP        |
| Project 6 | Behavioural Intelligence & Optimisation Engine   | Post-MVP   |

---

## 4. Bounded Contexts

### 4.1 PNR Ingestion Context

Responsible for receiving and processing PNR data from GDS, APIs or email-parsed sources.

Owns:

- PNR records
- Raw PNR archive references
- PNR lifecycle
- PNR-created and PNR-updated events

Publishes:

- `PNRCreated`
- `PNRUpdated`

Should not own:

- Trip compliance
- Traveller communication
- Opportunity scoring
- Reporting dashboards

---

### 4.2 Trip Management Context

Responsible for creating and maintaining trip records derived from PNRs, bookings and segments.

Owns:

- Trip records
- Trip lifecycle state
- Trip dates
- Origin and destination
- Trip-to-segment relationships

Publishes:

- `TripCreated`
- `TripUpdated`

Consumes:

- `PNRCreated`
- `PNRUpdated`
- `SegmentAdded`
- `SegmentUpdated`
- `SegmentRemoved`

---

### 4.3 Segment Management Context

Responsible for managing travel segments including air, hotel, rail and car.

Owns:

- Segment records
- Segment type-specific data
- Segment lifecycle
- Segment relationship to trip

Publishes:

- `SegmentAdded`
- `SegmentUpdated`
- `SegmentRemoved`

Consumes:

- `PNRCreated`
- `PNRUpdated`

---

### 4.4 Traveller Context

Responsible for traveller identity and profile matching.

Owns:

- Traveller records
- Traveller identifiers
- Traveller contact data
- External profile references

Publishes:

- `TravellerCreated`
- `TravellerUpdated`

Consumes:

- `PNRCreated`
- `PNRUpdated`

---

### 4.5 Booking Reconciliation Context

Responsible for determining whether hotel bookings belong to known trips.

Owns:

- Hotel booking reconciliation state
- Match confidence scores
- Match reasons
- Orphan hotel bookings
- Coverage calculations
- Manual reconciliation decisions

Publishes:

- `HotelMatched`
- `HotelRejected`
- `HotelCoverageUpdated`
- `HotelOrphanDetected`
- `ReconciliationUpdated`

Consumes:

- `TripCreated`
- `TripUpdated`
- `SegmentAdded`
- `SegmentUpdated`
- `SegmentRemoved`
- `TravellerUpdated`
- `BookingCreated`
- `BookingCancelled`

---

### 4.6 Opportunity Detection Context

Responsible for detecting actionable commercial, compliance and duty-of-care opportunities.

Owns:

- Opportunity records
- Opportunity scoring
- Opportunity priority
- Opportunity lifecycle
- Revenue estimates
- Supplier contract risks
- Duty-of-care assessments

Publishes:

- `OpportunityCreated`
- `OpportunityUpdated`
- `OpportunityClosed`
- `OpportunityEscalated`

Consumes:

- `TripCreated`
- `TripUpdated`
- `HotelMatched`
- `HotelRejected`
- `HotelCoverageUpdated`
- `SegmentAdded`
- `SegmentUpdated`
- `SegmentRemoved`
- `PolicyChanged`
- `SupplierContractChanged`

---

### 4.7 Traveller Engagement Context

Responsible for contacting travellers and capturing responses.

Owns:

- Communications
- Communication schedules
- Traveller response records
- Booking requests
- Agent escalation queue
- Communication audit history

Publishes:

- `CommunicationSent`
- `TravellerResponded`
- `BookingRequestCreated`
- `OpportunityConverted`

Consumes:

- `OpportunityCreated`
- `OpportunityUpdated`
- `OpportunityEscalated`
- `OpportunityClosed`

---

### 4.8 Compliance Analytics Portal Context

Responsible for the user-facing operational interface.

Owns:

- Portal user experience
- Dashboard views
- Reporting views
- Role-based access
- Administrative workflows
- Audit visibility

Consumes data from:

- Itinerary Service
- Reconciliation Service
- Opportunity Engine
- Traveller Engagement Service
- Future Intelligence Service

The portal should not directly own core domain decisions. It should display, filter, manage and action records owned by backend services.

---

### 4.9 Behavioural Intelligence Context

Post-MVP service responsible for predictive and optimisation features.

Owns:

- Behaviour profiles
- Prediction records
- Recommendation records
- Model performance records

Publishes:

- `RecommendationCreated`
- `ConversionPredicted`
- `SupplierRiskForecasted`

Consumes:

- Trip lifecycle events
- Reconciliation outcomes
- Opportunity outcomes
- Communication outcomes
- Portal manual actions

This service is excluded from MVP implementation.

---

## 5. Event-Driven Architecture

### 5.1 Event Bus

Use AWS EventBridge as the platform event backbone.

All domain services publish events to EventBridge.

Downstream services subscribe to only the event types they require.

Services must not directly call each other for core lifecycle state changes unless explicitly required by an API workflow.

---

## 6. Event Flow Overview

### 6.1 Initial Trip Creation Flow

```text
PNR Ingestion
  ↓ publishes PNRCreated
EventBridge
  ↓
Trip Management
  ↓ publishes TripCreated
Segment Management
  ↓ publishes SegmentAdded events
EventBridge
  ↓
Booking Reconciliation
  ↓
Opportunity Detection
```

---

### 6.2 Hotel Booking Reconciliation Flow

```text
Hotel Booking Created
  ↓
Booking Reconciliation Engine
  ↓ evaluates traveller, date, destination and coverage match
  ↓ publishes one of:
      HotelMatched
      HotelRejected
      HotelOrphanDetected
      HotelCoverageUpdated
  ↓
Opportunity Detection Engine
```

---

### 6.3 Missing Hotel Opportunity Flow

```text
TripCreated / TripUpdated
  ↓
Opportunity Detection Engine
  ↓ determines hotel required
  ↓ checks accommodation coverage
  ↓ calculates opportunity score
  ↓ publishes OpportunityCreated
  ↓
Traveller Engagement Platform
  ↓ sends traveller communication
  ↓ captures response
  ↓ publishes TravellerResponded or BookingRequestCreated
```

---

### 6.4 Traveller Engagement Conversion Flow

```text
OpportunityCreated
  ↓
CommunicationSent
  ↓
TravellerResponded
  ↓
BookingRequestCreated
  ↓
Hotel booking added
  ↓
HotelMatched
  ↓
OpportunityClosed
```

---

### 6.5 Analytics Flow

```text
Operational services
  ↓ publish domain events
EventBridge
  ↓
Analytics read models / reporting tables
  ↓
Compliance Analytics Portal
```

The portal should query read-optimised views rather than directly joining every operational database.

---

## 7. Shared Event Schema Rules

All events must use the shared envelope schema.

Each event file should live in:

```text
schemas/
```

Recommended structure:

```text
schemas/
├── envelope.schema.json
├── pnr-created.schema.json
├── pnr-updated.schema.json
├── trip-created.schema.json
├── trip-updated.schema.json
├── segment-added.schema.json
├── segment-updated.schema.json
├── segment-removed.schema.json
├── traveller-created.schema.json
├── traveller-updated.schema.json
├── booking-created.schema.json
├── booking-updated.schema.json
├── booking-cancelled.schema.json
├── hotel-matched.schema.json
├── hotel-rejected.schema.json
├── hotel-coverage-updated.schema.json
├── opportunity-created.schema.json
├── opportunity-updated.schema.json
├── opportunity-closed.schema.json
├── communication-sent.schema.json
├── traveller-responded.schema.json
└── booking-request-created.schema.json
```

---

## 8. Event Envelope Standard

Every event must include:

```json
{
  "eventId": "uuid",
  "eventType": "EventName",
  "occurredAt": "2026-05-31T10:00:00Z",
  "source": "service-name",
  "version": "1.0.0",
  "correlationId": "uuid",
  "causationId": "uuid",
  "tenantId": "uuid",
  "payload": {}
}
```

Rules:

- `eventId` must be unique.
- `eventType` must match the schema constant.
- `occurredAt` must be UTC.
- `source` must identify the publishing service.
- `version` must use semantic versioning.
- `correlationId` must remain consistent across a business workflow.
- `causationId` should reference the triggering event or command.
- `tenantId` is mandatory for multi-tenant isolation.

---

## 9. Database Ownership Rules

Each bounded context owns its own database tables.

Other services must not directly write to another service's tables.

Read access should use one of:

1. Published events.
2. Service APIs.
3. Read models.
4. Reporting projections.

### 9.1 Service-Owned Tables

| Service            | Owns Tables                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| PNR Ingestion      | PNRs, raw PNR references                                                    |
| Trip Management    | Trips, trip segments                                                        |
| Segment Management | Segments, type-specific segment data                                        |
| Traveller          | Travellers, traveller identifiers                                           |
| Reconciliation     | Hotel bookings, reconciliation matches, match reasons, coverage records     |
| Opportunity        | Opportunities, opportunity scores, contract risks, duty-of-care assessments |
| Engagement         | Communications, communication events, traveller responses, booking requests |
| Portal             | Users, roles, preferences, UI configuration, audit views                    |
| Intelligence       | Behaviour profiles, predictions, recommendations, model metrics             |

---

## 10. API Boundary Rules

APIs should be used for:

- UI queries
- Manual review actions
- Administrative workflows
- Synchronous user actions
- Read models

Events should be used for:

- Domain state changes
- Lifecycle transitions
- Reassessment triggers
- Asynchronous workflows
- Audit traceability

---

## 11. Core Service APIs

### 11.1 Booking Reconciliation Engine

```text
POST /reconciliation/evaluate
GET /reconciliation/{tripId}
GET /reconciliation/orphans
POST /reconciliation/manual-review
```

---

### 11.2 Opportunity Detection Engine

```text
POST /opportunities/evaluate
GET /opportunities
GET /opportunities/{id}
GET /opportunities/high-priority
GET /opportunities/contracts
```

---

### 11.3 Traveller Engagement Platform

```text
POST /communications/send
GET /communications
GET /traveller/{token}
POST /traveller/respond
POST /booking-request
```

---

### 11.4 Compliance Analytics Portal

The portal should consume backend APIs rather than owning domain logic.

Suggested API categories:

```text
GET /dashboard/summary
GET /portal/opportunities
GET /portal/trips/{id}
GET /portal/travellers/{id}
GET /portal/compliance
GET /portal/suppliers
GET /portal/communications
GET /portal/reports
GET /portal/audit
```

---

## 12. Multi-Tenant Security

All domain records must include:

- `tenantId`
- `corporateId` where applicable
- Created/updated audit fields

Tenant isolation is mandatory.

Users may only access:

1. Their tenant.
2. Their assigned corporate accounts.
3. Data allowed by their role.

The portal must enforce role-based access control.

Suggested roles:

- Platform Administrator
- TMC Administrator
- TMC User
- Corporate Administrator
- Corporate User

---

## 13. Audit Requirements

All important domain decisions must be explainable and auditable.

Audit is required for:

- PNR ingestion
- Trip creation and updates
- Segment creation, updates and removal
- Hotel matching decisions
- Match confidence score reasons
- Opportunity scoring
- Traveller communications
- Traveller responses
- Manual overrides
- Administrative configuration changes

Audit records should capture:

```text
audit_id
tenant_id
entity_type
entity_id
action
actor_type
actor_id
old_value
new_value
reason
created_at
correlation_id
```

---

## 14. MVP Implementation Sequence for Kiro

Kiro should not attempt to build the full platform in one task.

Build in this order.

### Phase 1 — Foundation

1. Create repository structure.
2. Add schema files.
3. Add shared TypeScript types.
4. Add JSON schema validation.
5. Add event envelope utilities.
6. Add EventBridge publisher abstraction.
7. Add EventBridge consumer abstraction.
8. Add shared logging and correlation ID middleware.

### Phase 2 — Core Itinerary Events

1. Implement PNR event types.
2. Implement Trip event types.
3. Implement Segment event types.
4. Implement Traveller event types.
5. Add unit tests for schema validation.
6. Add mock event fixtures.

### Phase 3 — Booking Reconciliation Engine

1. Implement hotel booking data model.
2. Implement candidate trip search.
3. Implement confidence score calculator.
4. Implement match reason storage.
5. Implement coverage calculator.
6. Implement orphan booking service.
7. Implement reconciliation event publishing.
8. Add manual review endpoint.

### Phase 4 — Opportunity Detection Engine

1. Implement hotel requirement rules.
2. Implement accommodation status evaluation.
3. Implement compliance evaluation placeholder.
4. Implement opportunity scoring.
5. Implement revenue estimator.
6. Implement supplier contract risk placeholder.
7. Implement opportunity lifecycle.
8. Publish opportunity events.

### Phase 5 — Traveller Engagement Platform

1. Implement communication trigger consumer.
2. Implement email template model.
3. Implement communication scheduling.
4. Implement email delivery abstraction.
5. Implement secure traveller action token.
6. Implement traveller landing page API.
7. Implement traveller response capture.
8. Implement booking request workflow.
9. Implement escalation queue.

### Phase 6 — Compliance Analytics Portal

1. Implement authentication and roles.
2. Implement dashboard shell.
3. Implement opportunities list and detail.
4. Implement trip detail.
5. Implement traveller detail.
6. Implement compliance dashboard.
7. Implement supplier dashboard.
8. Implement communications dashboard.
9. Implement audit views.
10. Implement exports.

### Phase 7 — Behavioural Intelligence

Do not build for MVP.

Create only placeholders/interfaces if needed.

---

## 15. Recommended Repository Structure

```text
hci-platform/
├── docs/
│   ├── architecture-integration-guide.md
│   ├── project-2-booking-reconciliation-engine.md
│   ├── project-3-opportunity-detection-engine.md
│   ├── project-4-traveller-engagement-platform.md
│   ├── project-5-compliance-analytics-portal.md
│   └── project-6-behavioural-intelligence-engine.md
│
├── schemas/
│   ├── envelope.schema.json
│   ├── pnr-created.schema.json
│   ├── pnr-updated.schema.json
│   ├── trip-created.schema.json
│   ├── trip-updated.schema.json
│   ├── segment-added.schema.json
│   ├── segment-updated.schema.json
│   └── segment-removed.schema.json
│
├── packages/
│   ├── shared-types/
│   ├── event-contracts/
│   ├── validation/
│   └── observability/
│
├── services/
│   ├── pnr-ingestion/
│   ├── trip-management/
│   ├── segment-management/
│   ├── traveller/
│   ├── booking-reconciliation/
│   ├── opportunity-detection/
│   ├── traveller-engagement/
│   └── analytics-api/
│
├── apps/
│   └── compliance-analytics-portal/
│
├── infrastructure/
│   ├── eventbridge/
│   ├── database/
│   ├── api-gateway/
│   ├── cognito/
│   └── terraform-or-cdk/
│
└── tests/
    ├── contract-tests/
    ├── integration-tests/
    └── fixtures/
```

---

## 16. Kiro Task Control Rules

When using Kiro, each task should be small.

Recommended task size:

- One bounded context
- One API
- One event consumer
- One event publisher
- One schema group
- One database migration
- One test suite

Avoid prompts such as:

> Build the entire HCI platform.

Use prompts such as:

> Implement the Booking Reconciliation confidence scoring module only. Use the schemas in `/schemas`. Do not create new event contracts. Add unit tests.

---

## 17. Kiro Global Instruction Prompt

Use this prompt at the start of the project.

```text
You are building the Hotel Compliance Intelligence platform.

Use the Markdown specifications in /docs and the JSON schemas in /schemas as the source of truth.

Do not invent new bounded contexts, event names, payload fields or database ownership rules unless explicitly instructed.

Follow the Architecture & Integration Guide.

Implement the system in small increments.

Each task must:
1. State which bounded context it belongs to.
2. State which files it will create or modify.
3. Use existing schemas where available.
4. Add tests for new domain logic.
5. Avoid cross-service database writes.
6. Publish and consume events using the shared event envelope.
7. Preserve tenant isolation.
8. Maintain auditability.

If a requirement is unclear, create a TODO rather than inventing behaviour.
```

---

## 18. Immediate Next Build Recommendation

The next Kiro task should be:

```text
Create the base repository structure for the HCI platform.

Add folders:
/docs
/schemas
/packages/shared-types
/packages/event-contracts
/packages/validation
/packages/observability
/services/booking-reconciliation
/services/opportunity-detection
/services/traveller-engagement
/apps/compliance-analytics-portal
/infrastructure
/tests/contract-tests
/tests/fixtures

Do not implement business logic yet.
Add README files explaining the purpose of each folder.
```

After that, ask Kiro to implement schema validation and TypeScript type generation.

---

## 19. Key Architectural Principles

1. Events are the source of integration.
2. Services own their own data.
3. APIs support user actions and synchronous queries.
4. The portal does not own domain decisions.
5. Every important decision must be explainable.
6. Tenant isolation is mandatory.
7. MVP excludes behavioural intelligence.
8. Kiro should build in small, testable increments.
9. Existing schemas are the source of truth.
10. No service should infer missing contracts if a schema is absent.

---

## 20. Definition of Done

A module is complete only when:

- Domain logic is implemented.
- Event schemas are validated.
- Unit tests exist.
- Integration tests exist for event flows.
- Audit records are generated.
- Tenant isolation is enforced.
- Errors are logged with correlation IDs.
- Documentation is updated.
- Kiro has not introduced undeclared event contracts.
