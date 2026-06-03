# Project 3A-1 — Opportunity Types Analysis

## Purpose

This document defines and categorises all opportunity types that the Opportunity Detection Engine must evaluate. Each opportunity type represents a distinct business scenario where traveller intervention, supplier optimisation, or compliance remediation can generate measurable value.

---

## Opportunity Type 1: Missing Hotel

### Purpose

Identify trips where accommodation is required but no hotel booking exists. This is the primary revenue recovery opportunity — the traveller needs a hotel but has not booked one through managed channels.

### Triggering Conditions

- Trip meets hotel requirement rules (BR-101 to BR-108):
  - Trip duration > 24 hours (BR-102)
  - Trip spans multiple dates (BR-103)
  - Arrival after 22:00 (BR-104)
  - Departure before 07:00 (BR-105)
  - International multi-day trip (BR-106)
  - Long distance domestic > 150 miles, > 1 day (BR-107)
- AND HotelCoverageUpdated received with coveragePercent = 0 and coverageStatus = `no_accommodation`
- AND no HotelOrphanDetected within reassociation window for this traveller/trip
- NOT triggered if BR-101 (same day return) applies

### Business Value

- Direct revenue: commission on hotel booking
- Programme compliance: bookings through managed channel
- Duty of care: traveller location becomes known
- Typical opportunity value: estimated room nights × average daily rate × commission rate

### Traveller-Facing or Internal-Only

**Traveller-facing.** The traveller should be contacted to offer hotel booking assistance.

### Expected Closure Conditions

- BR-1001: Hotel added (HotelMatched event received for this trip)
- BR-1002: Traveller declined
- BR-1003: Trip cancelled (TripUpdated with cancelled status)
- BR-1005: Opportunity expired (departure date passed)
- BR-1004: Manual closure by TMC/corporate admin

### Likely Downstream Consumers

- Project 4 (Traveller Engagement): trigger missing hotel communication
- Project 5 (Analytics): missing hotel rate, conversion rate, revenue recovered

---

## Opportunity Type 2: Partial Coverage

### Purpose

Identify trips where a hotel booking exists but does not cover the full trip duration. The traveller has some accommodation but additional nights are unaccounted for — representing both a revenue opportunity and a duty of care gap.

### Triggering Conditions

- HotelCoverageUpdated received with coveragePercent between 1 and 99
- AND coverageStatus is `mostly_covered`, `partially_covered`, or `minimally_covered`
- AND trip meets hotel requirement rules for the uncovered nights
- NOT triggered if coveragePercent = 100 (fully_covered)

### Business Value

- Incremental revenue: commission on additional nights
- Duty of care: complete traveller visibility
- Lower value than Missing Hotel but higher conversion likelihood (traveller already engaged)

### Traveller-Facing or Internal-Only

**Traveller-facing.** The traveller should be offered assistance for remaining nights.

### Expected Closure Conditions

- BR-1001: Additional hotel added, coverage reaches 100%
- BR-1002: Traveller confirms private accommodation for remaining nights
- BR-1003: Trip cancelled
- BR-1005: Opportunity expired
- BR-1004: Manual closure

### Likely Downstream Consumers

- Project 4 (Traveller Engagement): partial coverage communication (different template from missing hotel)
- Project 5 (Analytics): partial coverage frequency, gap night distribution

---

## Opportunity Type 3: Out of Policy Hotel

### Purpose

Identify hotel bookings that violate corporate travel policy. The hotel exists but does not comply with one or more policy rules — creating compliance risk and potentially higher costs.

### Triggering Conditions

- HotelMatched event received (hotel is linked to a trip)
- AND one or more compliance rules fail (BR-401 to BR-405):
  - BR-401: Supplier not in preferred programme
  - BR-402: Nightly rate exceeds policy cap
  - BR-403: Hotel outside approved geographic area
  - BR-404: Destination risk exceeds threshold
  - BR-405: Hotel sustainability score below threshold
- NOT triggered if BR-406 (executive traveller exception) applies

### Business Value

- Cost savings: redirect to lower-cost compliant supplier
- Programme compliance: enforce policy adherence
- Negotiating leverage: demonstrate volume to preferred suppliers
- Audit readiness: visibility of non-compliance rates

### Traveller-Facing or Internal-Only

**Internal-only for most cases.** The corporate or TMC admin reviews. May become traveller-facing if pre-trip rebooking is possible.

### Expected Closure Conditions

- Traveller rebooks to compliant hotel
- Corporate admin grants policy exception (BR-406, BR-1101)
- Trip cancelled
- Manual closure with documented reason

### Likely Downstream Consumers

- Project 5 (Analytics): compliance rate dashboard, policy violation trends
- Project 4 (Traveller Engagement): only if pre-trip rebooking window exists

---

## Opportunity Type 4: Direct Booked Hotel (Supplier Leakage)

### Purpose

Identify hotel bookings made outside the managed travel programme — directly with the hotel or via consumer booking sites. The accommodation exists but revenue was not captured through the TMC channel.

### Triggering Conditions

- HotelMatched event received
- AND booking source indicates direct/external channel (not via TMC programme)
- OR supplier code does not match any contracted supplier
- BR-504: Hotel booked outside preferred programme

### Business Value

- Revenue recovery: redirect future bookings to managed channel
- Supplier attainment: count toward contractual commitments
- Negotiating data: demonstrate true travel volume to suppliers
- Programme savings: corporate negotiated rates typically lower

### Traveller-Facing or Internal-Only

**Internal-only.** This is a programme management insight. Traveller communication is inappropriate for completed bookings.

### Expected Closure Conditions

- Noted and recorded (no action required beyond awareness)
- Manual closure by programme manager
- If pattern persists: escalate to corporate admin for policy enforcement

### Likely Downstream Consumers

- Project 5 (Analytics): leakage rate, leakage by supplier/destination/traveller
- Future: Behavioural Intelligence for predictive leakage alerts

---

## Opportunity Type 5: Preferred Supplier Opportunity

### Purpose

Identify situations where a hotel booking could fulfil a supplier contract commitment. The corporate has volume commitments to preferred hotel chains — each booking routed correctly contributes to attainment targets.

### Triggering Conditions

- BR-506: Supplier contract forecast below commitment threshold
- AND a new trip is detected where the destination has a preferred supplier property
- AND no hotel yet booked (Missing Hotel) or hotel booked with non-preferred supplier
- BR-801: Forecast below commitment (risk = HIGH)
- BR-802: Forecast within 5% (risk = WATCH)

### Business Value

- Contract attainment: avoid penalty or unlock rebates
- Negotiating position: demonstrate programme delivery
- Unit cost reduction: preferred rates typically negotiated lower

### Traveller-Facing or Internal-Only

**Hybrid.** Internal for tracking and reporting. Traveller-facing only when a specific preferred property recommendation can be made during booking.

### Expected Closure Conditions

- Hotel booked with preferred supplier
- Contract period ends (time-based expiry)
- Supplier contract cancelled or renegotiated
- Manual closure

### Likely Downstream Consumers

- Project 5 (Analytics): contract attainment dashboard, supplier risk heatmap
- Project 4 (Traveller Engagement): preferred supplier recommendation in booking communications

---

## Opportunity Type 6: Duty of Care Accommodation Gap

### Purpose

Identify trips where the traveller's accommodation location is unknown. This is a safety and liability concern — the corporate has a duty of care obligation to know where their employees are staying.

### Triggering Conditions

- BR-505: Trip exists AND accommodation status is unknown
- Trip meets hotel requirement rules (accommodation is needed)
- AND HotelCoverageUpdated shows no_accommodation or minimally_covered
- AND no HotelOrphanDetected within reassociation window
- BR-703: No accommodation data
- BR-704: High risk destination (increases priority)

### Business Value

- Risk mitigation: legal and moral duty of care compliance
- Insurance: coverage may require known accommodation
- Emergency response: locate travellers during incidents
- Regulatory: some jurisdictions require employer visibility of employee location

### Traveller-Facing or Internal-Only

**Traveller-facing.** The traveller should be contacted to confirm accommodation arrangements, even if booking through external channels.

### Expected Closure Conditions

- Traveller confirms accommodation location (even if externally booked)
- Hotel booking added through any channel
- Trip cancelled
- Manual closure by duty of care officer
- Departure date passed (expired — but should be flagged as unresolved)

### Likely Downstream Consumers

- Project 4 (Traveller Engagement): duty of care communication (urgent tone, different from revenue communications)
- Project 5 (Analytics): duty of care compliance rate, unresolved gap rate by destination risk level

---

## Opportunity Type 7: Orphan Hotel Review

### Purpose

Identify hotel bookings detected as orphans by Project 2 that remain unresolved beyond a configurable threshold. An orphan hotel is a booking that cannot be attached to any known trip — it may represent a trip not yet in the system, a personal booking, or a data quality issue.

### Triggering Conditions

- HotelOrphanDetected event received from Project 2
- AND reassociation window has elapsed partially (e.g. 7+ days without resolution)
- OR reassociation deadline approaching (e.g. within 5 days of expiry)
- NOT triggered during the first 7 days (allow natural reassociation via TripCreated)

### Business Value

- Data quality: identify bookings that may indicate missing PNR data
- Reconciliation accuracy: reduce false compliance alerts
- Programme visibility: understand bookings outside normal flow
- Low direct revenue but high operational accuracy value

### Traveller-Facing or Internal-Only

**Internal-only initially.** TMC operations review orphan bookings. May become traveller-facing if traveller confirmation is needed to determine whether the booking is business or personal.

### Expected Closure Conditions

- Orphan resolved by Project 2 (HotelMatched event received after reassociation)
- TMC admin marks as personal booking
- TMC admin creates missing trip and links booking
- Reassociation deadline expires without resolution
- Manual closure

### Likely Downstream Consumers

- Project 5 (Analytics): orphan rate, average resolution time, unresolved orphan count
- Project 4 (Traveller Engagement): only if traveller confirmation required

---

## Summary Table

| #   | Opportunity Type        | Rules                              | Traveller-Facing | Primary Value          |
| --- | ----------------------- | ---------------------------------- | ---------------- | ---------------------- |
| 1   | Missing Hotel           | BR-501, BR-101–108                 | Yes              | Revenue + Duty of Care |
| 2   | Partial Coverage        | BR-502, BR-301–305                 | Yes              | Revenue + Duty of Care |
| 3   | Out of Policy Hotel     | BR-503, BR-401–406                 | Internal         | Compliance + Cost      |
| 4   | Direct Booked (Leakage) | BR-504                             | Internal         | Programme Visibility   |
| 5   | Preferred Supplier      | BR-506, BR-801–804                 | Hybrid           | Contract Attainment    |
| 6   | Duty of Care Gap        | BR-505, BR-701–704                 | Yes              | Safety + Liability     |
| 7   | Orphan Hotel Review     | (derived from HotelOrphanDetected) | Internal         | Data Quality           |

---

## Key Design Constraint

**Project 3 must NOT generate Missing Hotel or Partial Coverage opportunities during the Project 2 orphan reassociation window.** An orphan hotel booking may resolve naturally when the corresponding trip arrives. Generating premature opportunities would create false alerts.

The recommended approach: suppress opportunity creation for a trip/traveller when an active HotelOrphanDetected exists with an unexpired reassociation deadline for that traveller.
