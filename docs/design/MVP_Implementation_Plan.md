# MVP Implementation Plan — Hotel Attachment Analytics

## 1. Development Work Breakdown

| ID  | Task                                                           | Sprint | Estimate |
| --- | -------------------------------------------------------------- | ------ | -------- |
| 1.1 | Itinerary store API client interface                           | 1      | 2 days   |
| 1.2 | Mock itinerary store adapter (test data)                       | 1      | 2 days   |
| 1.3 | Polling ingestion service (5-min cycle)                        | 1      | 3 days   |
| 1.4 | Canonical data mapper (itinerary → platform events)            | 1      | 3 days   |
| 1.5 | Deduplication + high-water mark tracking                       | 1      | 1 day    |
| 1.6 | New event schemas (ItineraryReceived, AttachmentAssessmentDue) | 1      | 1 day    |
| 2.1 | Hotel-appropriate trip engine (BR-1005)                        | 2      | 2 days   |
| 2.2 | Grace period timer (24h fixed)                                 | 2      | 2 days   |
| 2.3 | Attachment assessment engine                                   | 2      | 3 days   |
| 2.4 | Partial attachment calculation (BR-1006)                       | 2      | 1 day    |
| 2.5 | Orphan hotel heuristic matcher (BR-1007)                       | 2      | 2 days   |
| 2.6 | Opportunity creation from assessment                           | 2      | 2 days   |
| 2.7 | Integration with existing opportunity-detection scoring        | 2      | 1 day    |
| 3.1 | Attachment rate projector                                      | 3      | 2 days   |
| 3.2 | Attachment curve projector (days-before-departure)             | 3      | 3 days   |
| 3.3 | Attachment delay projector                                     | 3      | 1 day    |
| 3.4 | Corporate comparison projector                                 | 3      | 2 days   |
| 3.5 | Query service: getAttachmentOverview                           | 3      | 1 day    |
| 3.6 | Query service: getAttachmentCurve                              | 3      | 1 day    |
| 3.7 | Query service: getCorporateComparison                          | 3      | 1 day    |
| 3.8 | API handlers for attachment queries                            | 3      | 2 days   |
| 4.1 | Portal types + mock data for attachment                        | 4      | 1 day    |
| 4.2 | Attachment Overview dashboard page                             | 4      | 3 days   |
| 4.3 | Attachment Curve dashboard page                                | 4      | 2 days   |
| 4.4 | Corporate Comparison dashboard page                            | 4      | 2 days   |
| 4.5 | Sidebar navigation update                                      | 4      | 0.5 day  |
| 4.6 | Portal tests                                                   | 4      | 1 day    |
| 5.1 | Connect to itinerary store sandbox                             | 5      | 2 days   |
| 5.2 | Integration validation (10 test scenarios)                     | 5      | 3 days   |
| 5.3 | Performance testing (1000 itineraries)                         | 5      | 1 day    |
| 5.4 | Monitoring + alerting setup                                    | 5      | 1 day    |
| 5.5 | Pilot TMC deployment                                           | 5      | 2 days   |
| 5.6 | Post-deployment validation                                     | 5      | 1 day    |

---

## 2. Packages Affected

| Package                              | Changes                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `@hci/event-contracts`               | Add ItineraryReceived, AttachmentAssessmentDue, HotelCoverageUpdated event schemas + types |
| `@hci/behaviour-intelligence`        | Consume attachment delay data for profile updates                                          |
| `@hci/opportunity-detection`         | Accept opportunities from attachment assessment (new source)                               |
| `@hci/analytics-api`                 | Add attachment projectors + query handlers                                                 |
| `@hci/compliance-analytics-portal`   | Add attachment dashboard pages                                                             |
| **NEW** `@hci/itinerary-ingestion`   | Polling service, data mapper, grace period timer                                           |
| **NEW** `@hci/attachment-assessment` | Hotel-appropriate engine, attachment calculator, orphan matcher                            |

---

## 3. New Services Required

| Service                 | Responsibility                                                                                    | Pattern                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `itinerary-ingestion`   | Polls itinerary store, transforms to platform events, manages high-water mark                     | Event producer (same pattern as PNR ingestion)         |
| `attachment-assessment` | Evaluates hotel appropriateness, manages grace period, calculates coverage, creates opportunities | Domain service (same pattern as opportunity-detection) |

Both services follow the existing monorepo pattern under `services/`.

---

## 4. New Database Tables Required

| Schema                  | Table                             | Purpose                                               |
| ----------------------- | --------------------------------- | ----------------------------------------------------- |
| `itinerary_ingestion`   | `ingestion_checkpoints`           | High-water mark per tenant for polling                |
| `itinerary_ingestion`   | `raw_itineraries`                 | Cached itinerary state for change detection           |
| `attachment_assessment` | `trip_assessments`                | Trip assessment status (pending/assessed/excluded)    |
| `attachment_assessment` | `attachment_snapshots`            | Point-in-time attachment state per trip (for curve)   |
| `attachment_assessment` | `grace_period_timers`             | Active grace period timers awaiting expiry            |
| `analytics` (existing)  | `attachment_rates`                | Projected attachment rate per tenant/corporate/period |
| `analytics` (existing)  | `attachment_curves`               | Projected curve data (rate at each day-milestone)     |
| `analytics` (existing)  | `corporate_attachment_comparison` | Per-corporate attachment metrics                      |

---

## 5. Existing Code to Reuse

| Existing Component                                                | Reuse In                                          |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| `@hci/event-contracts` createEnvelope, InMemoryEventBus           | Event publishing from ingestion + assessment      |
| `@hci/event-contracts` schema validation                          | Validating new event types                        |
| `@hci/opportunity-detection` scoring engine                       | Scoring attachment opportunities                  |
| `@hci/opportunity-detection` domain model (Opportunity entity)    | Creating opportunities from assessment            |
| `@hci/behaviour-intelligence` BehaviourProfileEngine              | Updating traveller profiles with attachment delay |
| `@hci/analytics-api` projector pattern                            | Building attachment projectors                    |
| `@hci/analytics-api` query service pattern                        | Attachment query functions                        |
| `@hci/analytics-api` API controller pattern                       | Attachment API handlers                           |
| `@hci/compliance-analytics-portal` KpiCard, DataTable, PageHeader | Attachment dashboard UI                           |
| `@hci/compliance-analytics-portal` mock client pattern            | Mock attachment data                              |
| Database client interface (all services)                          | PostgreSQL repositories for new tables            |
| In-memory repository pattern (all services)                       | Unit testing new repositories                     |

---

## 6. Sprint Plan

### Sprint 1 — Itinerary Ingestion (2 weeks)

| Task                                 | Owner   | Done When                                                 |
| ------------------------------------ | ------- | --------------------------------------------------------- |
| Itinerary store API client interface | Backend | Interface defined, mock adapter passes tests              |
| Mock itinerary store adapter         | Backend | 50+ test itineraries with varied scenarios                |
| Polling ingestion service            | Backend | Polls mock store, produces TripCreated/TripUpdated events |
| Canonical data mapper                | Backend | All itinerary fields mapped to platform events            |
| Deduplication                        | Backend | Same itinerary processed twice produces no duplicates     |
| New event schemas                    | Backend | JSON schemas + TypeScript types + contract tests          |

**Exit criteria:** Ingestion service consumes mock itineraries, produces valid platform events, passes 20+ unit tests.

### Sprint 2 — Attachment Assessment (2 weeks)

| Task                         | Owner   | Done When                                               |
| ---------------------------- | ------- | ------------------------------------------------------- |
| Hotel-appropriate engine     | Backend | BR-1005 correctly classifies trips                      |
| Grace period timer           | Backend | 24h timer creates/expires correctly                     |
| Attachment assessment engine | Backend | Calculates full/partial/missing attachment              |
| Orphan hotel matcher         | Backend | Same-traveller heuristic matches correctly              |
| Opportunity creation         | Backend | Missing-hotel opportunities flow into existing pipeline |
| Integration with scoring     | Backend | Attachment opportunities scored by existing engine      |

**Exit criteria:** End-to-end flow from itinerary → assessment → opportunity. Grace period suppresses premature opportunities. 30+ unit tests.

### Sprint 3 — Analytics (2 weeks)

| Task                           | Owner   | Done When                                    |
| ------------------------------ | ------- | -------------------------------------------- |
| Attachment rate projector      | Backend | Current rate calculated per tenant/corporate |
| Attachment curve projector     | Backend | Rate at each day-milestone calculated        |
| Attachment delay projector     | Backend | Average and distribution calculated          |
| Corporate comparison projector | Backend | Per-corporate ranking                        |
| Query services (3 functions)   | Backend | Return correct data from projections         |
| API handlers                   | Backend | 6 endpoints returning consistent responses   |

**Exit criteria:** All attachment analytics queryable via API handlers. Projectors tested with mock event streams. 25+ tests.

### Sprint 4 — Portal Dashboards (2 weeks)

| Task                      | Owner    | Done When                                       |
| ------------------------- | -------- | ----------------------------------------------- |
| Portal types + mock data  | Frontend | TypeScript types match API responses            |
| Attachment Overview page  | Frontend | KPIs + rate + gap + revenue                     |
| Attachment Curve page     | Frontend | Visual curve (text-based MVP, no chart library) |
| Corporate Comparison page | Frontend | Ranked table with trend indicators              |
| Navigation update         | Frontend | New "Hotel Attachment" section in sidebar       |
| Portal tests              | Frontend | 15+ tests covering all pages                    |

**Exit criteria:** All attachment dashboards render with mock data. Loading/error/empty states work. Existing pages unaffected.

### Sprint 5 — Pilot Deployment (1 week)

| Task                               | Owner         | Done When                              |
| ---------------------------------- | ------------- | -------------------------------------- |
| Connect to itinerary store sandbox | Backend + Ops | Live data flowing                      |
| Integration validation             | QA            | 10 test scenarios pass                 |
| Performance testing                | QA            | 1000 itineraries processed in <5 min   |
| Monitoring + alerting              | Ops           | CloudWatch dashboards + error alerts   |
| Pilot TMC deployment               | Ops           | Single TMC seeing real attachment data |
| Post-deployment validation         | All           | Data matches manual verification       |

**Exit criteria:** One TMC using the platform with real itinerary data. Attachment rate matches manual calculation within 2%.

---

## 7. Dependencies

| Dependency                               | Required By                      | Status      | Risk                           |
| ---------------------------------------- | -------------------------------- | ----------- | ------------------------------ |
| Itinerary store API documentation        | Sprint 1                         | Needed      | Medium — may require discovery |
| Itinerary store sandbox access           | Sprint 1 (mock), Sprint 5 (live) | Needed      | Low — internal system          |
| Existing event-contracts package         | Sprint 1                         | ✅ Complete | None                           |
| Existing opportunity-detection service   | Sprint 2                         | ✅ Complete | None                           |
| Existing analytics-api projector pattern | Sprint 3                         | ✅ Complete | None                           |
| Existing portal component library        | Sprint 4                         | ✅ Complete | None                           |
| AWS Aurora cluster (per-service schema)  | Sprint 5                         | Needed      | Medium — infrastructure        |
| CloudWatch + alerting setup              | Sprint 5                         | Needed      | Low — standard                 |
| Pilot TMC agreement                      | Sprint 5                         | Needed      | Medium — commercial            |

---

## 8. Testing Strategy

| Layer                  | Approach                                                           | Target                        |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------- |
| Unit tests             | Vitest, in-memory repositories, mock event bus                     | 80+ tests across new packages |
| Integration tests      | E2E flows using in-memory adapters (same pattern as Project 6E-2)  | 10+ scenarios                 |
| Contract tests         | JSON schema validation for new event types                         | 6+ valid/invalid fixtures     |
| Portal tests           | Vitest + React Testing Library                                     | 15+ component tests           |
| Performance tests      | 1000 itinerary load test against ingestion service                 | <5 min processing time        |
| Integration validation | 10 defined test scenarios against sandbox                          | All pass before pilot         |
| Manual validation      | Compare platform attachment rate to manual spreadsheet calculation | Within 2%                     |

**Test pyramid:**

- 80% unit tests (fast, isolated, run in CI)
- 15% integration tests (end-to-end flows with in-memory infrastructure)
- 5% manual validation (pilot TMC data verification)

---

## Summary

| Sprint    | Duration    | Key Deliverable                                                 |
| --------- | ----------- | --------------------------------------------------------------- |
| 1         | 2 weeks     | Itinerary data flowing into platform as events                  |
| 2         | 2 weeks     | Attachment assessed, grace period active, opportunities created |
| 3         | 2 weeks     | All attachment analytics queryable                              |
| 4         | 2 weeks     | Dashboard visible in portal                                     |
| 5         | 1 week      | Live data from pilot TMC                                        |
| **Total** | **9 weeks** | **Hotel Attachment Analytics live for one TMC**                 |

---

_Document version: 1.0 — June 2026_
