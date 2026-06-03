# Project 2 — Booking Reconciliation Engine — Status

**Status: Complete (MVP domain logic, ready for Project 3 integration)**

**Total test count: 367** (35 event-contracts + 38 contract-tests + 142 pnr-ingestion + 152 booking-reconciliation)

---

## Completed Phases

| Phase  | Description                                                                                                                                           | Status |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Schema | Event Contract Design + JSON schemas (7 schemas, envelope updated to 16 event types)                                                                  | ✅     |
| 2A     | Domain Model (HotelBooking, ReconciliationCandidate, CoverageAssessment, OrphanBooking, matching rules, ReconciliationDecisionService)                | ✅     |
| 2B     | Event Mapping (event factories: HotelMatched, HotelRejected, HotelCoverageUpdated, HotelOrphanDetected)                                               | ✅     |
| 2C     | Application Services (BookingReconciliationService, 5 repository interfaces, in-memory implementations)                                               | ✅     |
| 2D     | Persistence Design (PostgreSQL migration, PgHotelBookingRepository with version conflict handling)                                                    | ✅     |
| 2E     | End-to-End Validation (version consistency, high-confidence match, orphan/reassociation, cancellation/coverage, tenant/correlation/version hardening) | ✅     |

---

## Implemented Capabilities

- Probabilistic hotel booking reconciliation (confidence 0–100)
- 8 matching rules: BR-201 to BR-208 (traveller, employee, email, city, country, date overlap, full night coverage, booking proximity)
- Confidence thresholds: matched (≥80), candidate/manual-review (60–79), rejected (<60), orphaned (no candidates)
- Coverage assessment with 5 tiers: fully_covered, mostly_covered, partially_covered, minimally_covered, no_accommodation (BR-301 to BR-305)
- Orphan booking detection with 30-day reassociation window
- Orphan reassociation on TripCreated/TripUpdated
- Booking lifecycle: create, update (reassessment), cancel (coverage recalculation)
- Booking version conflict handling (stale versions rejected, same version idempotent)
- Multi-tenant isolation enforced at repository and service layers
- Correlation ID propagation across all published events
- Audit explanation on every reconciliation decision
- Event publishing via in-memory event bus (ready for EventBridge swap)
- All emitted events validate against authoritative JSON schemas

---

## Business Rules Implemented

| Rule ID | Rule Name              | Score  | Notes                          |
| ------- | ---------------------- | ------ | ------------------------------ |
| BR-201  | Exact Traveller Match  | +50    | Same travellerId               |
| BR-202  | Employee Number Match  | +40    | Same employee number           |
| BR-203  | Email Match            | +30    | Case-insensitive               |
| BR-204  | Destination City Match | +15    | Case-insensitive               |
| BR-205  | Country Match          | +10    | Case-insensitive               |
| BR-206  | Date Overlap           | +25    | Hotel dates overlap trip dates |
| BR-207  | Full Night Coverage    | +20    | Hotel covers entire trip range |
| BR-208  | Booking Proximity      | +10    | Booked within 30 days of trip  |
| BR-301  | Fully Covered          | 100%   | Coverage status tier           |
| BR-302  | Mostly Covered         | 80–99% | Coverage status tier           |
| BR-303  | Partially Covered      | 50–79% | Coverage status tier           |
| BR-304  | Minimally Covered      | 1–49%  | Coverage status tier           |
| BR-305  | No Accommodation       | 0%     | Coverage status tier           |

---

## Event Contracts Consumed

| Event Type       | Source Context  | Purpose                                 |
| ---------------- | --------------- | --------------------------------------- |
| BookingCreated   | External/PNR    | Triggers reconciliation evaluation      |
| BookingUpdated   | External/PNR    | Triggers reassessment of existing match |
| BookingCancelled | External/PNR    | Removes match, recalculates coverage    |
| TripCreated      | Trip Management | Triggers orphan reassociation           |
| TripUpdated      | Trip Management | Triggers orphan reassociation           |

---

## Event Contracts Published

| Event Type           | Condition                       | Schema File                        |
| -------------------- | ------------------------------- | ---------------------------------- |
| HotelMatched         | Confidence ≥ 80                 | hotel-matched.schema.json          |
| HotelRejected        | Confidence < 60 with candidates | hotel-rejected.schema.json         |
| HotelCoverageUpdated | After match or cancellation     | hotel-coverage-updated.schema.json |
| HotelOrphanDetected  | No candidate trips found        | hotel-orphan-detected.schema.json  |

**Not published:** Candidate/manual-review results (confidence 60–79) do not emit external events.

---

## Test Summary

| Test File                              | Tests   | Coverage Area                                                            |
| -------------------------------------- | ------- | ------------------------------------------------------------------------ |
| domain-types.test.ts                   | 17      | Value objects, enums, DateRange, ConfidenceScore                         |
| entities.test.ts                       | 11      | HotelBooking, OrphanBooking, ReconciliationCandidate creation/validation |
| coverage-orphan.test.ts                | 16      | CoverageAssessment tiers, OrphanBooking lifecycle                        |
| matching-rules.test.ts                 | 16      | BR-201 to BR-208 individual rule evaluation                              |
| reconciliation-decision.test.ts        | 13      | ReconciliationDecisionService (orphan, matched, candidate, rejected)     |
| event-factories.test.ts                | 10      | Event factory mapping, payload validation                                |
| reconciliation-service.test.ts         | 10      | Application service orchestration                                        |
| pg-repositories.test.ts                | 6       | PostgreSQL repository version conflict handling                          |
| in-memory-version-consistency.test.ts  | 9       | In-memory repo version parity with Pg                                    |
| e2e-high-confidence-match.test.ts      | 9       | Full match flow + schema validation                                      |
| e2e-orphan-reassociation.test.ts       | 13      | Orphan detection + reassociation flow                                    |
| e2e-cancellation-coverage.test.ts      | 10      | Cancellation + multi-booking coverage                                    |
| e2e-tenant-correlation-version.test.ts | 12      | Tenant isolation, correlation, versioning                                |
| **Total**                              | **152** |                                                                          |

---

## Known Limitations

- PostgreSQL repositories use `DatabaseClient` interface — not connected to real Aurora yet
- EventBridge adapter is a stub — requires AWS infrastructure deployment
- No authentication/authorisation middleware
- No rate limiting or throttling
- Observability package is a stub (no structured logging implementation)
- Coverage calculation uses simplified model (1 match = 1 booking contributing)
- No deduplication for multiple candidates from the same trip
- `CandidateTripRepository.findCandidatesForBooking` is populated externally — no event consumer wiring yet
- Manual review endpoint not implemented (API scope)
- `ReconciliationUpdated` event explicitly excluded per architectural decision
- `HotelReviewRequired` event noted for future but not implemented

---

## Production Hardening Still Required

1. AWS Infrastructure — Aurora PostgreSQL, EventBridge, API Gateway, Lambda
2. Real database connection — wire Pg repositories to Aurora via `pg` client
3. EventBridge integration — replace InMemoryEventBus with EventBridgeAdapter
4. Event consumer wiring — consume TripCreated/TripUpdated to populate candidate_trips table
5. Authentication — Cognito JWT verification, extract RequestContext from token
6. Observability — structured logging, CloudWatch metrics, correlation ID middleware
7. REST API layer — POST /reconciliation/evaluate, GET /reconciliation/{tripId}, GET /reconciliation/orphans, POST /reconciliation/manual-review
8. Error recovery — dead letter queues, retry logic for failed event publishing
9. CI/CD pipeline — deploy via CDK, integration tests against real infrastructure
10. Coverage calculation refinement — use actual room nights rather than booking count

---

## Project 3 Readiness

**Project 2 is ready for Project 3 (Opportunity Detection) integration.**

Project 3 requires:

- ✅ HotelMatched events flowing through event bus (confirmed by e2e tests)
- ✅ HotelRejected events flowing through event bus (confirmed by e2e tests)
- ✅ HotelCoverageUpdated events with coverage status tiers (confirmed by e2e tests)
- ✅ HotelOrphanDetected events for orphan awareness (confirmed by e2e tests)
- ✅ Tenant isolation enforced (confirmed by e2e tests)
- ✅ Correlation propagation maintained (confirmed by e2e tests)
- ✅ All events validate against authoritative JSON schemas

Project 3 can consume Project 2 reconciliation events to detect missing hotel opportunities, partial coverage gaps, and compliance issues. The event contracts are stable and schema-validated.
