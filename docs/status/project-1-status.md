# Project 1 — Itinerary Intelligence Platform — Status

**Status: Complete (MVP domain logic, ready for Project 2 integration)**

**Total test count: 203** (35 event-contracts + 26 contract-tests + 142 pnr-ingestion)

---

## Completed Phases

| Phase | Description                                                                              | Status |
| ----- | ---------------------------------------------------------------------------------------- | ------ |
| 1A    | Event Schema Layer (JSON schemas, TypeScript types, Ajv validation, contract tests)      | ✅     |
| 1B    | Event Framework (publisher, consumer, envelope factory, in-memory bus, EventBridge stub) | ✅     |
| 2A    | Domain Model (Traveller, PNR, Trip, Segment, TimelineEvent entities)                     | ✅     |
| 2B    | Domain Events (event factories mapping domain → event payloads)                          | ✅     |
| 2C    | Application Services + Repository Interfaces                                             | ✅     |
| 2D    | Persistence Layer (PostgreSQL migrations, Pg repository implementations)                 | ✅     |
| 2E    | Mantic Point Adapter (DTO types, validation, mapping, IngestionService)                  | ✅     |
| 2F    | REST API Layer (controllers for POST /pnrs, GET /trips, GET /travellers, GET /timeline)  | ✅     |
| 2G    | End-to-End Test Slice (full flow validation with in-memory adapters)                     | ✅     |

---

## Architectural Decisions Implemented

| Decision                                     | Implementation                                                |
| -------------------------------------------- | ------------------------------------------------------------- |
| Q1 — Mantic Point webhook                    | Adapter layer with DTO → canonical model mapping              |
| Q2 — BookingCreated publisher                | PNR Ingestion detects hotel segments (ready for future event) |
| Q3 — Business rules as code                  | Domain entities enforce rules; designed for future DB config  |
| Q4 — One Aurora cluster, per-service schemas | SQL migration uses `pnr_ingestion` schema                     |
| Q8 — Out-of-order PNR updates                | `shouldAcceptVersion()` rejects stale versions                |
| Q9 — Capacity planning                       | Event-driven architecture supports 50K PNRs/day design        |

---

## Implemented Capabilities

- Mantic Point webhook payload ingestion (AIR, HTL, RAIL, CAR, TRN, OTH)
- Canonical domain model (Traveller, PNR, Trip, Segment, TimelineEvent)
- Versioned PNR processing with out-of-order rejection
- Independently versioned segments with optimistic conflict detection
- Immutable chronological timeline events
- Event publishing (TravellerCreated, PNRCreated/Updated, TripCreated/Updated, SegmentAdded/Updated/Removed)
- Event envelope with correlationId propagation across full request lifecycle
- Multi-tenant isolation enforced at repository and API layers
- PostgreSQL schema definitions and migration files
- REST API controllers with consistent error responses and correlationId
- Full end-to-end flow validated with in-memory adapters

---

## Known Limitations

- PostgreSQL repositories use `DatabaseClient` interface — not connected to real Aurora yet
- EventBridge adapter is a stub — requires AWS infrastructure deployment
- No authentication/authorisation middleware (RequestContext manually constructed)
- No rate limiting or throttling
- Observability package is a stub (no structured logging implementation)
- Trip entity does not support status mutation after creation
- Segment types `transfer` and `other` cannot produce schema-valid events (schema supports flight/rail/car/hotel only)
- No traveller deduplication by email (creates new traveller per ingestion)
- Segment events use tripId as tenantId placeholder (needs trip-to-tenant lookup in production)

---

## Remaining Work Before Production

1. AWS Infrastructure — Aurora PostgreSQL, EventBridge, API Gateway, Lambda, Cognito
2. Real database connection — wire Pg repositories to Aurora via `pg` client
3. EventBridge integration — replace InMemoryEventBus with EventBridgeAdapter
4. Authentication — Cognito JWT verification, extract RequestContext from token
5. Observability — structured logging, CloudWatch metrics, correlation ID middleware
6. Traveller deduplication — match by email/employee number before creating
7. Error recovery — dead letter queues, retry logic for failed event publishing
8. CI/CD pipeline — deploy via CDK, integration tests against real infrastructure
9. Fix segment event tenantId — resolve from trip ownership, not tripId

---

## Project 2 Readiness

**Project 1 is ready for Project 2 (Booking Reconciliation) integration.**

Project 2 requires:

- ✅ Canonical Trip and Segment data (available via events and API)
- ✅ TripCreated, TripUpdated, SegmentAdded events flowing through event bus
- ⚠️ BookingCreated/Updated/Cancelled event schemas (listed in TODO-future-schemas.md — must be authored)
- ⚠️ Hotel segment detection triggering booking lifecycle events (adapter detects HTL segments; event publishing not yet wired)

Project 2 can begin development using the in-memory event bus to consume Project 1 events. AWS EventBridge integration is not required for Project 2 domain logic development.
