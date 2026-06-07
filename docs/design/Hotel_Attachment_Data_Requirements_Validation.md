# Hotel Attachment Data Requirements Validation

## Purpose

Validate that every KPI across the HCI Compliance Analytics Platform can be calculated from real-world TMC data feeds. Identify data sources, mandatory fields, and gaps.

---

## 1. Data Dictionary

### Core Data Entities

| Entity        | Description                               | Primary Source             | Fallback Source        |
| ------------- | ----------------------------------------- | -------------------------- | ---------------------- |
| Traveller     | Individual business traveller             | Mid-office / OBT           | GDS PNR name           |
| Corporate     | Corporate client organisation             | TMC CRM                    | Mid-office             |
| Trip          | A travel itinerary (one or more segments) | GDS PNR                    | Mid-office             |
| Segment       | Individual flight/rail leg                | GDS                        | OBT                    |
| Hotel Booking | Managed hotel reservation                 | GDS / OBT / Hotel platform | Mid-office             |
| Communication | Outbound message to traveller             | Platform-generated         | TMC CRM / Email system |
| Response      | Traveller reply or action                 | Platform-captured          | Email parsing          |
| Opportunity   | Compliance gap requiring action           | Platform-generated         | —                      |
| Orphan Hotel  | Hotel booking not yet matched to trip     | GDS / Hotel platform       | —                      |

### Field Definitions

| Field                  | Type          | Mandatory       | Source                     | Example                |
| ---------------------- | ------------- | --------------- | -------------------------- | ---------------------- |
| travellerId            | UUID          | Yes             | Mid-office                 | `a1b2c3d4-...`         |
| tenantId               | UUID          | Yes             | TMC CRM                    | `tmc-001`              |
| corporateId            | UUID          | Yes             | TMC CRM                    | `corp-acme`            |
| tripId                 | UUID          | Yes             | GDS/Mid-office             | `trip-5678`            |
| pnrLocator             | String        | Yes             | GDS                        | `ABC123`               |
| departureDate          | ISO date-time | Yes             | GDS                        | `2026-07-15T08:30:00Z` |
| arrivalDate            | ISO date-time | Yes             | GDS                        | `2026-07-15T14:00:00Z` |
| originCity             | String        | Yes             | GDS                        | `London`               |
| destinationCity        | String        | Yes             | GDS                        | `New York`             |
| tripDurationHours      | Number        | Yes             | Derived                    | `24`                   |
| isMultiDay             | Boolean       | Yes             | Derived                    | `true`                 |
| isInternational        | Boolean       | Yes             | Derived                    | `true`                 |
| hotelBookingId         | UUID          | Conditional     | GDS/OBT                    | `htl-9012`             |
| hotelCheckIn           | ISO date      | Conditional     | GDS/OBT                    | `2026-07-15`           |
| hotelCheckOut          | ISO date      | Conditional     | GDS/OBT                    | `2026-07-17`           |
| hotelNights            | Integer       | Conditional     | Derived                    | `2`                    |
| estimatedCommission    | Number        | Optional        | Mid-office rate tables     | `45.00`                |
| travellerEmail         | String        | Yes             | TMC CRM / OBT              | `j.smith@acme.com`     |
| travellerPhone         | String        | Optional        | TMC CRM                    | `+44 7700 900000`      |
| preferredChannel       | String        | Optional        | Platform-learned           | `email`                |
| tripCreatedAt          | ISO date-time | Yes             | GDS/Mid-office             | `2026-07-01T10:00:00Z` |
| hotelBookedAt          | ISO date-time | Conditional     | GDS/OBT                    | `2026-07-03T14:30:00Z` |
| communicationSentAt    | ISO date-time | Yes (when sent) | Platform                   | `2026-07-05T09:00:00Z` |
| travellerRespondedAt   | ISO date-time | Conditional     | Platform                   | `2026-07-05T11:30:00Z` |
| responseType           | Enum          | Conditional     | Platform                   | `booked`               |
| destinationRiskLevel   | Enum          | Optional        | Risk intelligence provider | `elevated`             |
| supplierContractStatus | Enum          | Optional        | Mid-office                 | `on_track`             |

---

## 2. KPI Dependency Matrix

### Opportunity Operations

| KPI                  | Required Fields                                    | Source                 | Calculable?            |
| -------------------- | -------------------------------------------------- | ---------------------- | ---------------------- |
| Active Opportunities | tripId, departureDate, hotelBookingId (absence of) | GDS + Mid-office       | ✅ Yes                 |
| Critical Count       | opportunityScore, departureDate                    | Platform-derived       | ✅ Yes                 |
| Awaiting Action      | opportunityStatus                                  | Platform-derived       | ✅ Yes                 |
| At Risk              | departureDate (≤48h), no hotel                     | GDS                    | ✅ Yes                 |
| Priority Breakdown   | opportunityScore thresholds                        | Platform-derived       | ✅ Yes                 |
| Estimated Commission | averageDailyRate, nights, commissionRate           | Mid-office rate tables | ⚠️ Requires rate table |

### Duty of Care

| KPI                    | Required Fields                           | Source              | Calculable?           |
| ---------------------- | ----------------------------------------- | ------------------- | --------------------- |
| Visibility Rate        | tripCount, hotelConfirmedCount            | GDS + Mid-office    | ✅ Yes                |
| Unresolved Gaps        | trips without hotel OR confirmed location | GDS                 | ✅ Yes                |
| High-Risk Unresolved   | destinationRiskLevel + unresolved         | GDS + Risk provider | ⚠️ Requires risk feed |
| Approaching Departures | departureDate (≤72h), no hotel            | GDS                 | ✅ Yes                |
| Destination Breakdown  | destinationCity, gap count per city       | GDS                 | ✅ Yes                |

### Traveller Engagement

| KPI                 | Required Fields                  | Source             | Calculable? |
| ------------------- | -------------------------------- | ------------------ | ----------- |
| Communications Sent | communicationId, sentAt, channel | Platform-generated | ✅ Yes      |
| Response Rate       | responseCount ÷ sentCount        | Platform           | ✅ Yes      |
| Conversion Rate     | bookingsAfterComm ÷ sentCount    | Platform + GDS     | ✅ Yes      |
| Escalation Count    | escalationStatus                 | Platform           | ✅ Yes      |
| Channel Breakdown   | channel field per communication  | Platform           | ✅ Yes      |
| Response Types      | responseType enum                | Platform           | ✅ Yes      |

### Behaviour Intelligence

| KPI                   | Required Fields                           | Source                | Calculable?            |
| --------------------- | ----------------------------------------- | --------------------- | ---------------------- |
| Avg Booking Lead Time | tripCreatedAt, hotelBookedAt              | GDS + Mid-office      | ✅ Yes                 |
| Booking Consistency   | lead time std deviation over trips        | Derived from history  | ✅ Yes                 |
| Compliance Rate       | trips with managed hotel ÷ total          | GDS + Mid-office      | ✅ Yes                 |
| Self-Booking Rate     | independent bookings ÷ total              | Platform attribution  | ✅ Yes                 |
| Preferred Channel     | channel response history                  | Platform              | ✅ Yes                 |
| Communication Fatigue | comms30d, ignored count, declined count   | Platform              | ✅ Yes                 |
| Archetype Assignment  | all profile metrics (10+ trips)           | Derived               | ✅ Yes                 |
| Revenue At Risk       | estimatedCommission, attachmentLikelihood | Mid-office + Platform | ⚠️ Requires rate table |
| Prediction Accuracy   | recommendedAction, actualOutcome          | Platform              | ✅ Yes                 |

### Hotel Attachment Analytics

| KPI                     | Required Fields                                   | Source                    | Calculable?            |
| ----------------------- | ------------------------------------------------- | ------------------------- | ---------------------- |
| Current Attachment Rate | hotel-appropriate trips, attached trips           | GDS + Mid-office          | ✅ Yes                 |
| Attachment Gap          | target (configured), current rate                 | Platform config + derived | ✅ Yes                 |
| Revenue Captured        | commission from attached bookings                 | Mid-office rate tables    | ⚠️ Requires rate table |
| Revenue Lost            | commission for unattached eligible trips          | Mid-office rate tables    | ⚠️ Requires rate table |
| Avg Attachment Delay    | tripCreatedAt, hotelBookedAt                      | GDS timestamps            | ✅ Yes                 |
| Attachment Curve        | attachment status at each day-before-departure    | GDS timestamps            | ✅ Yes                 |
| Pending Assessment      | tripCreatedAt + gracePeriod config                | Platform                  | ✅ Yes                 |
| Hotel Appropriate Trip  | tripDuration, isMultiDay, arrival/departure times | GDS                       | ✅ Yes                 |
| Partial Attachment      | hotelNights ÷ requiredNights                      | GDS                       | ✅ Yes                 |
| Orphan Match Rate       | orphan hotels matched ÷ total orphans             | Platform matching engine  | ✅ Yes                 |
| TMC Value Add           | attributed bookings ÷ total bookings              | Platform attribution      | ✅ Yes                 |
| Time-to-Attachment      | hotelBookedAt − tripCreatedAt                     | GDS timestamps            | ✅ Yes                 |

---

## 3. Integration Dependency Matrix

| Data Source                            | Provides                                                       | KPIs Enabled                          | Priority         |
| -------------------------------------- | -------------------------------------------------------------- | ------------------------------------- | ---------------- |
| **GDS (Amadeus/Sabre/Travelport)**     | PNR, segments, dates, destinations, hotel bookings             | All core KPIs                         | Critical — MVP   |
| **Mid-office (Tramada/Agencia/i:FAO)** | Traveller profiles, corporate mapping, rate tables, commission | Revenue KPIs, corporate mapping       | Critical — MVP   |
| **OBT (online booking tool)**          | Self-booked hotels, traveller preferences                      | Attachment, self-booking rate         | High — MVP       |
| **TMC CRM**                            | Traveller contact details, corporate hierarchy                 | Communication, engagement             | High — MVP       |
| **Risk Intelligence Provider**         | Destination risk levels                                        | Duty of care risk classification      | Medium — Phase 2 |
| **Email/SMS Platform**                 | Delivery status, open/click tracking                           | Response rate accuracy                | Medium — Phase 2 |
| **Hotel Platform (HRS/HotelHub)**      | Negotiated rates, availability                                 | Rate opportunity, commission accuracy | Low — Phase 2    |
| **Traveller App**                      | Push notification delivery, in-app responses                   | Channel effectiveness                 | Low — Phase 3    |

---

## 4. Missing Data Assessment

### Fully Available from Standard TMC Data (no gap)

- Trip creation timestamps
- Departure/arrival dates and times
- Destination cities and countries
- Hotel booking presence/absence
- Hotel check-in/check-out dates
- PNR locators
- Traveller names and identifiers
- Corporate client mapping
- Trip duration (derived)
- Multi-day indicator (derived)
- International indicator (derived)

### Available but Requires Integration Work

| Data                                         | Gap                                           | Mitigation                                                                                 |
| -------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Estimated Commission                         | Requires rate table or average-by-destination | Use industry average (£45/night) as default; refine per-client when rate tables integrated |
| Destination Risk Level                       | Not in GDS — requires external feed           | Use static risk classification by country initially; integrate live feed in Phase 2        |
| Traveller Email/Phone                        | May be in CRM only, not PNR                   | Require mid-office integration to pull profile; fall back to PNR contact field             |
| Self-booked Hotels (outside managed channel) | Invisible unless traveller confirms           | Treat as "unattached" initially; add expense-report reconciliation in Phase 3              |
| Communication Delivery Status                | Requires email/SMS platform integration       | Track "sent" in MVP; add "delivered/opened/clicked" when email platform integrated         |

### Cannot Be Calculated from Standard TMC Data

| KPI / Data                                | Issue                                                  | Recommended Approach                                                                               |
| ----------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Hotels booked outside managed channel** | TMC has no visibility into consumer booking sites      | Rely on traveller self-declaration ("Already Booked" response) + future expense-report integration |
| **Traveller satisfaction / irritation**   | No standard data feed for traveller sentiment          | Infer from fatigue model (declined + ignored communications); add survey integration post-MVP      |
| **Actual hotel stay confirmation**        | Knowing the traveller actually checked in (vs no-show) | Not available without hotel confirmation feed; use booking presence as proxy                       |
| **Traveller seniority / VIP status**      | Not consistently available in GDS                      | Requires HR feed or CRM enrichment; use travel frequency as proxy                                  |
| **Cost avoided by suppression**           | Requires knowing what would have been sent             | Calculate as: suppressed communications × average cost per communication                           |

---

## 5. Data Quality Rules

| Rule                  | Field                            | Validation                                                        |
| --------------------- | -------------------------------- | ----------------------------------------------------------------- |
| Mandatory UUID format | travellerId, tripId, corporateId | Must be valid UUID v4                                             |
| Future departure      | departureDate                    | Must be today or future (for active pipeline)                     |
| Positive duration     | tripDurationHours                | Must be > 0                                                       |
| Valid dates           | hotelCheckIn < hotelCheckOut     | Check-out must be after check-in                                  |
| Commission range      | estimatedCommission              | Must be ≥ 0, ≤ 10000                                              |
| Known destination     | destinationCity                  | Must not be empty or "UNKNOWN"                                    |
| Valid channel         | channel                          | Must be one of: email, sms, push_notification, in_app, agent_call |
| Chronological         | tripCreatedAt ≤ departureDate    | Trip cannot be created after departure                            |
| Booking timing        | hotelBookedAt ≥ tripCreatedAt    | Hotel cannot be booked before trip exists (except orphans)        |

---

## 6. Summary Assessment

| Module                 | KPIs Fully Calculable | KPIs Requiring Rate Tables | KPIs Requiring External Feed | KPIs Not Feasible Without New Integration |
| ---------------------- | --------------------- | -------------------------- | ---------------------------- | ----------------------------------------- |
| Opportunity Operations | 5/6                   | 1 (commission)             | 0                            | 0                                         |
| Duty of Care           | 4/5                   | 0                          | 1 (risk level)               | 0                                         |
| Traveller Engagement   | 6/6                   | 0                          | 0                            | 0                                         |
| Behaviour Intelligence | 8/9                   | 1 (revenue at risk)        | 0                            | 0                                         |
| Hotel Attachment       | 10/12                 | 2 (revenue captured/lost)  | 0                            | 0                                         |
| **Total**              | **33/38 (87%)**       | **4 (11%)**                | **1 (2%)**                   | **0**                                     |

**Conclusion:** 87% of KPIs are calculable from standard GDS + mid-office data available in any TMC. The remaining 13% require either a commission rate table (available from mid-office but needs mapping) or an external risk intelligence feed (available commercially). No KPI is fundamentally blocked — all are achievable with standard industry integrations.

---

_Document version: 1.0 — June 2026_
