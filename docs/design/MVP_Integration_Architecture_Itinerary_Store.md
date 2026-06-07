# MVP Integration Architecture: Mantic Point Itinerary Store

## Overview

For MVP, the HCI Compliance Analytics Platform consumes data from a single source: the Mantic Point Itinerary Store. This store is already populated from GDS data and contains the trip, traveller, segment, and hotel booking information needed for hotel attachment analytics.

All other integrations (mid-office, OBT, CRM, risk feeds, email platforms, expense systems) are production-phase, customer-by-customer additions.

---

## 1. Source Data Scope

The following data should be consumed from the Mantic Point Itinerary Store:

| Domain           | Data Available                                                   | Notes                                           |
| ---------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| Traveller        | Traveller ID, name, email (if in PNR)                            | Contact enrichment deferred to production       |
| Corporate/Client | Corporate ID, client name, tenant mapping                        | Available via itinerary store client hierarchy  |
| Trip             | Trip ID, creation timestamp, status                              | Core entity                                     |
| PNR              | PNR locator, GDS source, creation date                           | Links to trip                                   |
| Air Segments     | Origin, destination, departure/arrival date-time, carrier        | Provides trip duration and multi-day indicators |
| Rail Segments    | Origin, destination, departure/arrival date-time                 | Same as air                                     |
| Hotel Segments   | Hotel name, city, check-in, check-out, booking timestamp, status | Core for attachment calculation                 |
| Trip Status      | Active, cancelled, completed                                     | Filters active pipeline                         |
| Hotel Status     | Confirmed, cancelled, pending                                    | Determines attachment                           |
| Orphan Hotels    | Hotel bookings not linked to a trip (if store tracks this)       | May require matching logic                      |
| Timestamps       | Trip created, segments added, hotel booked, last modified        | Essential for attachment delay and curve        |

---

## 2. MVP Data Assumptions

| Assumption                                                                  | Rationale                                    |
| --------------------------------------------------------------------------- | -------------------------------------------- |
| Itinerary store already receives GDS updates within minutes                 | Standard GDS queue/notification flow         |
| Itinerary store contains traveller, trip, segment, and hotel data           | Core itinerary store function                |
| Traveller contact details may be limited to PNR email/phone                 | CRM enrichment deferred                      |
| Commission estimates will use a default (£45/night)                         | Rate table integration deferred              |
| Destination risk level is not available in MVP                              | External risk feed deferred                  |
| Policy compliance data (preferred supplier, rate cap) not available         | Mid-office integration deferred              |
| Only managed-channel hotel bookings are visible                             | Self-booked hotels outside GDS are invisible |
| Orphan hotel matching may be limited to same-traveller same-dates heuristic | Full matching engine is production scope     |

---

## 3. Ingestion Options

| Option                              | Complexity | Latency        | Reliability      | MVP Fit                         |
| ----------------------------------- | ---------- | -------------- | ---------------- | ------------------------------- |
| Scheduled polling (REST API pull)   | Low        | 1–5 min        | High             | ✅ Recommended                  |
| Webhook/event push from store       | Medium     | Near real-time | High             | Good but requires store changes |
| File export (SFTP/S3 JSON)          | Low        | Batch (hourly) | High             | Acceptable fallback             |
| Direct database read                | Low        | Real-time      | Risky (coupling) | ❌ Not recommended              |
| Event bus integration (EventBridge) | Medium     | Near real-time | High             | Production target               |

**MVP Recommendation: Scheduled polling via REST API**

The platform polls the itinerary store API every 5 minutes for new/updated itineraries. This requires no changes to the itinerary store, is simple to implement, and provides acceptable latency for a compliance analytics use case where real-time is not critical.

**Polling strategy:**

- Poll for itineraries modified since last poll timestamp
- Process each itinerary into platform events (TripCreated, TripUpdated, HotelSegmentDetected, etc.)
- Store the high-water mark timestamp for the next poll cycle
- Handle duplicates via idempotent event processing (deduplication on trip ID + version)

**Production evolution:** Replace polling with EventBridge events pushed from the itinerary store, achieving near-real-time latency without polling overhead.

---

## 4. Canonical Data Mapping

### Itinerary Store → Platform Concepts

| Itinerary Store Field                                    | Platform Concept | Platform Field    | Transformation                   |
| -------------------------------------------------------- | ---------------- | ----------------- | -------------------------------- |
| itinerary.id                                             | Trip             | tripId            | Direct map                       |
| itinerary.traveller.id                                   | Traveller        | travellerId       | Direct map                       |
| itinerary.client.id                                      | Corporate        | corporateId       | Direct map                       |
| itinerary.tenant.id                                      | Tenant           | tenantId          | Direct map                       |
| itinerary.pnr.locator                                    | PNR              | pnrLocator        | Direct map                       |
| itinerary.createdAt                                      | Trip             | tripCreatedAt     | ISO 8601                         |
| itinerary.status                                         | Trip             | tripStatus        | Map: active/cancelled/completed  |
| itinerary.segments[type=air].departure                   | Segment          | departureDateTime | ISO 8601                         |
| itinerary.segments[type=air].arrival                     | Segment          | arrivalDateTime   | ISO 8601                         |
| itinerary.segments[type=air].origin                      | Segment          | originCity        | City code → name                 |
| itinerary.segments[type=air].destination                 | Segment          | destinationCity   | City code → name                 |
| itinerary.hotelSegments[].hotelName                      | Hotel Booking    | hotelName         | Direct map                       |
| itinerary.hotelSegments[].checkIn                        | Hotel Booking    | hotelCheckIn      | ISO date                         |
| itinerary.hotelSegments[].checkOut                       | Hotel Booking    | hotelCheckOut     | ISO date                         |
| itinerary.hotelSegments[].bookedAt                       | Hotel Booking    | hotelBookedAt     | ISO 8601                         |
| itinerary.hotelSegments[].status                         | Hotel Booking    | hotelStatus       | Map: confirmed/cancelled/pending |
| (derived) first segment departure − last segment arrival | Trip             | tripDurationHours | Calculated                       |
| (derived) spans multiple calendar days                   | Trip             | isMultiDay        | Calculated                       |
| (derived) origin country ≠ destination country           | Trip             | isInternational   | Calculated                       |
| (derived) hotel nights cover required nights             | Coverage         | coveragePercent   | Calculated                       |

### Derived Platform Entities

| Platform Entity        | Derived From                                                         | Logic                    |
| ---------------------- | -------------------------------------------------------------------- | ------------------------ |
| Hotel Appropriate Trip | tripDurationHours > 24 OR isMultiDay OR late arrival/early departure | BR-1005                  |
| Attachment Status      | hotelSegments.length > 0 AND status = confirmed                      | Attached if true         |
| Partial Attachment     | hotel nights < required nights                                       | BR-1006 fractional       |
| Attachment Delay       | hotelBookedAt − tripCreatedAt                                        | Time difference in hours |
| Pending Assessment     | tripCreatedAt + 24h > now                                            | Grace period active      |
| Opportunity            | hotel appropriate AND NOT attached AND grace period expired          | Standard lifecycle       |

---

## 5. Hotel Attachment Calculations

**Hotel Appropriate Trip:** Trip duration > 24 hours OR multi-day OR arrival after 22:00 OR departure before 07:00. Exclude cancelled trips and day-returns.

**Attached Trip:** At least one confirmed hotel segment exists covering at least one required overnight.

**Missing Hotel:** Hotel appropriate trip with zero hotel segments after grace period expiry.

**Partial Attachment:** Hotel segments exist but cover fewer nights than required. Contribution = covered nights ÷ required nights.

**Orphan Hotel Match:** Hotel booking exists for same traveller with dates overlapping the trip's required nights but not linked to the trip in the itinerary store. MVP heuristic: same traveller + hotel check-in within trip date range.

**Pending Assessment:** Trip created within last 24 hours. Not yet assessed. Excluded from attachment rate and opportunity creation.

**Attachment Delay:** hotelBookedAt − tripCreatedAt, measured in hours. Only calculated for trips where a hotel was eventually booked.

**Attachment Curve:** For each trip, record whether a hotel was attached at each milestone (30, 20, 14, 10, 7, 5, 3, 1, 0 days before departure). Aggregate across all trips to produce the curve.

---

## 6. Grace Period Handling

- Fixed 24-hour grace period for MVP
- No configuration UI — hardcoded default
- Timer starts at tripCreatedAt
- If hotel segment appears during grace period → trip is "self-attached," no opportunity created
- If grace period expires with no hotel → opportunity created, enters standard scoring/lifecycle
- Future: TMC-level and corporate-level overrides via configuration hierarchy (designed in Project 6H)

---

## 7. Event Flow

```
Itinerary Store (polled every 5 min)
    │
    ▼
Ingestion Adapter (transforms to platform events)
    │
    ├─→ TripCreated (new itinerary detected)
    ├─→ TripUpdated (itinerary modified)
    ├─→ HotelSegmentDetected (hotel added to itinerary)
    ├─→ HotelSegmentCancelled (hotel removed/cancelled)
    ├─→ TripCancelled (itinerary cancelled)
    │
    ▼
Grace Period Timer
    │
    ├─→ (hotel arrives within 24h) → SelfAttached — no opportunity
    ├─→ (24h expires, no hotel) → AttachmentAssessmentDue
    │
    ▼
Assessment Engine
    │
    ├─→ HotelCoverageUpdated (coverage calculated)
    ├─→ OpportunityCreated (if missing hotel / partial)
    │
    ▼
Existing Platform Services
    ├─→ Opportunity Detection (scoring, prioritisation)
    ├─→ Behaviour Intelligence (profile update, archetype)
    ├─→ Analytics Projectors (attachment rate, curve, KPIs)
```

---

## 8. MVP Analytics Supported

| Analytic                                 | Supported from Itinerary Store? | Notes                                                       |
| ---------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| Hotel Attachment Rate                    | ✅ Yes                          | Core calculation from trips + hotel segments                |
| Attachment Curve (days before departure) | ✅ Yes                          | Requires tripCreatedAt + hotelBookedAt + departureDate      |
| Pending Assessment Count                 | ✅ Yes                          | Trips within 24h of creation                                |
| Missing Hotel Opportunities              | ✅ Yes                          | No hotel after grace period                                 |
| Partial Coverage                         | ✅ Yes                          | Hotel nights < trip nights                                  |
| Duty of Care Visibility                  | ✅ Yes                          | Hotel confirmed = accommodation known                       |
| Approaching Departures                   | ✅ Yes                          | Departure within 72h, no hotel                              |
| Basic Traveller Behaviour                | ✅ Yes                          | Attachment delay history per traveller (after 10+ trips)    |
| Basic Corporate Comparison               | ✅ Yes                          | Attachment rate per corporate                               |
| Attachment Delay Distribution            | ✅ Yes                          | hotelBookedAt − tripCreatedAt across all trips              |
| Traveller Archetype (basic)              | ⚠️ Partial                      | Booking timing available; response time requires comms data |
| Revenue At Risk                          | ⚠️ Partial                      | Uses default commission estimate                            |
| Destination breakdown                    | ✅ Yes                          | From segment destination fields                             |

---

## 9. Analytics Not Fully Supported in MVP

| Analytic                               | Limitation                            | Workaround                                           |
| -------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Exact commission revenue               | No rate table from mid-office         | Use £45/night default, flag as estimated             |
| Live destination risk                  | No external risk feed                 | Use static country risk classification               |
| Policy compliance (preferred supplier) | No supplier programme data            | Defer to production                                  |
| Traveller satisfaction                 | No sentiment data                     | Infer from fatigue model                             |
| External self-booked hotels            | Invisible outside GDS                 | Rely on "Already Booked" response when comms enabled |
| Email/SMS delivery confirmation        | No email platform integration         | Track "sent" only in MVP                             |
| Communication response timing          | Requires comms platform in production | Available once engagement module goes live           |
| Traveller preferred channel            | Requires communication history        | Default to email in MVP                              |
| Orphan hotel matching (complex)        | Limited to same-traveller heuristic   | Full matching engine in production                   |

---

## 10. Integration Validation — Test Scenarios

| #   | Scenario                                                      | Expected Outcome                                                                         |
| --- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Trip created with no hotel segments                           | After 24h grace period: OpportunityCreated, counted as "missing hotel"                   |
| 2   | Trip created with hotel segment present                       | Immediately "attached," no opportunity, contributes to attachment rate                   |
| 3   | Trip with 2-night hotel for 4-night requirement               | Partial attachment (50%), partial coverage opportunity created                           |
| 4   | Hotel added 6 hours after trip creation (within grace period) | Self-attached, no opportunity created                                                    |
| 5   | Hotel added 30 hours after trip creation (after grace period) | Opportunity was created at 24h; now closed as "fulfilled"                                |
| 6   | Trip cancelled after opportunity created                      | Opportunity closed as "cancelled," removed from attachment rate denominator              |
| 7   | Itinerary updated (dates changed)                             | TripUpdated event, reassess departure proximity and coverage                             |
| 8   | Orphan hotel booking for same traveller, overlapping dates    | Matched to trip, attachment confirmed, opportunity suppressed                            |
| 9   | Grace period expires, no hotel, 48h to departure              | Opportunity created with High priority (time urgency)                                    |
| 10  | Traveller with 10+ trips, consistent 8-hour attachment delay  | Behaviour profile updated, archetype assigned, future communications timed to 12h window |

---

## 11. Production Expansion Path

| Phase        | Integration            | What It Adds                                                           |
| ------------ | ---------------------- | ---------------------------------------------------------------------- |
| Production 1 | Mid-office rate tables | Accurate commission revenue, rate opportunity detection                |
| Production 2 | TMC CRM                | Traveller contact enrichment (email, phone, preferences)               |
| Production 3 | OBT integration        | Self-booked hotel visibility, preferred hotel tracking                 |
| Production 4 | Risk intelligence feed | Live destination risk levels for duty of care                          |
| Production 5 | Email/SMS platform     | Delivery tracking, open/click rates, precise response timing           |
| Production 6 | Expense reconciliation | Post-trip hotel confirmation for travellers who booked outside channel |
| Production 7 | Hotel programme data   | Preferred supplier compliance, negotiated rate comparison              |

Each production integration plugs into the existing event model — the platform publishes the same internal events regardless of source. The ingestion adapter is the only component that changes per integration.

---

## 12. Recommended MVP Roadmap

| Step | Deliverable                                  | Dependency                        |
| ---- | -------------------------------------------- | --------------------------------- |
| 1    | Ingestion design (this document)             | None                              |
| 2    | Canonical data mapping (field-level)         | Itinerary store API documentation |
| 3    | Mock itinerary store adapter                 | Test data                         |
| 4    | Polling ingestion service                    | Itinerary store sandbox access    |
| 5    | Grace period timer + assessment engine       | Step 4                            |
| 6    | Attachment rate projector                    | Step 5                            |
| 7    | Attachment curve projector                   | Step 5                            |
| 8    | Analytics API handlers for attachment KPIs   | Step 6 + 7                        |
| 9    | Portal dashboard — Hotel Attachment Overview | Step 8                            |
| 10   | Integration validation (10 test scenarios)   | Step 4 + sandbox                  |
| 11   | Production deployment (single TMC pilot)     | All steps + security review       |

**Estimated timeline:** Steps 1–3 complete (design phase). Steps 4–9 require itinerary store sandbox access and approximately 4–6 weeks of development. Step 10 requires 1 week of integration testing. Step 11 requires security sign-off and TMC pilot agreement.

---

_Document version: 1.0 — June 2026_
