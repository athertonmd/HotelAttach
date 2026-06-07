# Hotel Attachment Analytics & Assessment Policy Design

## 1. Executive Summary

Hotel Attachment Rate is the primary commercial KPI for Travel Management Companies operating hotel compliance programmes. It measures the percentage of eligible trips that have managed hotel accommodation attached before departure.

This document designs a comprehensive analytics capability around attachment rate, introduces an Assessment Grace Period to improve data quality and traveller experience, and defines the configuration and AI enhancement roadmap.

---

## 2. Business Problem

TMCs currently lack visibility into:

- How attachment rate changes over time relative to departure
- Which corporates, traveller segments, or archetypes drive poor attachment
- Whether communications are being triggered too early (before travellers naturally book)
- The optimal moment to intervene versus allowing self-booking behaviour

Without this, TMCs over-communicate (increasing fatigue), create misleading opportunities (inflating pipeline), and cannot demonstrate value improvement to corporate clients.

---

## 3. Hotel Attachment Analytics Design

### 3.1 Executive Attachment Overview

**Purpose:** Single-screen health check for TMC leadership showing programme-wide attachment performance.

**Target users:** TMC Directors, Account Managers, Corporate Travel Managers.

**KPI Cards:**

- Current Attachment Rate (%)
- Target Attachment Rate (%)
- Attachment Gap (target minus current)
- Revenue Captured (£)
- Revenue Lost (£)
- Month-on-Month Improvement (+/- %)

**Visualisations:**

- Attachment rate trend line (rolling 30/60/90 days)
- Attachment rate by corporate client (top 10 + bottom 10)
- Revenue captured vs revenue lost bar comparison

**Filters:** Date range, Corporate client, TMC branch.

**Business questions answered:** Is our programme improving? Where are the biggest gaps? Which clients need attention?

---

### 3.2 Attachment Trend Dashboard

**Purpose:** Track how attachment rate evolves over time to identify seasonal patterns, the impact of programme changes, and deterioration.

**Target users:** Operations Managers, Data Analysts, Account Managers.

**KPI Cards:**

- Current period attachment rate
- Previous period attachment rate
- Period change (+/- %)
- Best performing week
- Worst performing week

**Visualisations:**

- Daily/weekly/monthly attachment rate line chart
- Overlay: communications sent per period
- Overlay: opportunities created per period

**Filters:** Period (daily/weekly/monthly), Corporate, Date range.

**Business questions answered:** Is attachment improving or declining? Did a programme change (new communication strategy, new client onboarded) impact attachment? Are there seasonal patterns?

---

### 3.3 Attachment Curve Dashboard

**Purpose:** Show how attachment rate evolves relative to departure date — revealing when travellers actually book hotels.

**Target users:** Behaviour Intelligence analysts, Operations Managers, TMC strategists.

**KPI Cards:**

- Attachment at 30 days before departure
- Attachment at 7 days before departure
- Attachment at departure
- Percentage gained in final 7 days

**Visualisations:**

- X-axis: days before departure (30, 20, 14, 10, 7, 5, 3, 1, 0)
- Y-axis: cumulative attachment rate (%)
- Multiple lines: by archetype, by corporate, by segment
- Shaded area: grace period zone

**Filters:** Corporate, Archetype, Segment, Date range.

**Drill-downs:** Click a point on the curve to see which travellers attached at that interval.

**Business questions answered:** When do travellers actually book? Is our communication timing aligned with natural booking behaviour? Which archetypes book late? Where on the curve does TMC intervention have the most impact?

**How it supports Behaviour Intelligence:** The curve shape per archetype directly informs the predicted booking window. Autopilot travellers show a steep early curve (booking 14+ days out). Procrastinators show a flat line until 2–3 days before departure. This data trains the timing engine.

---

### 3.4 Corporate Comparison Dashboard

**Purpose:** Compare attachment performance across corporate clients to identify accounts needing attention and celebrate success.

**Target users:** Account Managers, TMC Leadership, Client Services.

**KPI Cards:**

- Highest performing corporate (%)
- Lowest performing corporate (%)
- Average across all corporates (%)
- Number of corporates below target

**Visualisations:**

- Ranked bar chart: attachment rate per corporate
- Trend sparklines per corporate (improving/declining indicator)
- Scatter plot: traveller volume vs attachment rate

**Filters:** TMC branch, Minimum trip volume, Date range.

**Business questions answered:** Which clients are struggling? Which are excelling? Is a declining client aware of their performance? Which clients justify additional investment in outreach?

**Recommended actions:**

- Corporates below 60% attachment: schedule account review
- Corporates trending down 5%+ month-over-month: proactive outreach to travel manager
- Corporates above 90%: candidate for reduced intervention (cost saving)

---

### 3.5 Traveller Behaviour Dashboard (Attachment View)

**Purpose:** Connect individual traveller booking behaviour to attachment outcomes.

**Target users:** Operations teams, Behaviour Intelligence analysts.

**KPI Cards:**

- Travellers with 100% attachment (self-sufficient)
- Travellers with 0% attachment (non-compliant)
- Average attachment delay (days before departure)
- Travellers improving vs declining

**Visualisations:**

- Distribution: travellers by personal attachment rate band
- Table: individual travellers with attachment rate, average delay, archetype, fatigue level

**Filters:** Corporate, Archetype, Attachment rate band, Date range.

**Business questions answered:** Which travellers always book independently? Which never book through managed channels? How does archetype correlate with attachment? Which travellers are changing behaviour?

---

### 3.6 Cohort Analysis Dashboard

**Purpose:** Group travellers by shared characteristics and compare attachment patterns across cohorts.

**Target users:** TMC strategists, Product managers, Data analysts.

**KPI Cards:**

- Number of cohorts analysed
- Best performing cohort
- Worst performing cohort
- Cohort with fastest improvement

**Visualisations:**

- Cohort comparison table: archetype × attachment rate × trend
- Time-series: cohort attachment rates over 6 months
- Waterfall: what drove change in each cohort

**Cohort dimensions:** Archetype, Segment, Corporate, Travel frequency, Destination type, Seniority level.

**Business questions answered:** Do frequent travellers attach better than infrequent? Does the procrastinator cohort respond to intervention? Which cohorts are worth investing communication effort in?

---

## 4. Business Rules

### BR-1001: Attachment Assessment Grace Period

A trip should not be assessed for hotel attachment opportunities until a configurable grace period has expired after trip creation. This prevents premature opportunity creation and unnecessary communication.

**Default MVP value:** 24 hours.

**Rationale:** Industry data shows that travellers frequently book flights first and add hotels within 24 hours. Assessing immediately creates false positives, inflates pipeline, and triggers premature outreach.

### BR-1002: Pending Assessment Status

Trips inside the grace period are assigned "Pending Assessment" status. They are excluded from:

- Active opportunity counts
- Attachment rate calculations (until assessed)
- Communication triggers
- Agent worklists

They are included in:

- Total trip volume reporting
- Grace period monitoring
- Pending Assessment KPI card

### BR-1003: Grace Period Expiry Trigger

When the grace period expires, the system assesses whether a hotel booking exists:

- If hotel attached → no opportunity created, trip counts as "attached"
- If no hotel → opportunity created, trip enters standard lifecycle

### BR-1004: Attachment Rate Exclusion During Grace Period

Trips in Pending Assessment do not count toward or against attachment rate. They become eligible for attachment rate calculation only after assessment.

---

## 5. Dashboard Impacts

### New KPI: Pending Assessment Count

**Definition:** The number of trips where accommodation may be required but the grace period has not yet expired.

**Why it matters:** This number tells operations teams how many potential opportunities are "in the pipeline" but not yet actionable. A consistently high number at morning review is normal (overnight trip creations). A number that does not decrease throughout the day suggests the grace period is too long or trip volume is surging.

**How to interpret:**

- Morning (08:00): expect this to be high — overnight trips are being assessed
- Midday (12:00): should have decreased significantly as grace periods expire
- If it remains high all day: review whether the grace period setting is appropriate

### Revised Opportunity Lifecycle

```
Trip Created
    ↓
Pending Assessment (grace period active)
    ↓
Grace Period Expires
    ↓
Attachment Assessment
    ↓ (no hotel found)
Opportunity Created → standard lifecycle
    ↓ (hotel found)
No Opportunity → counted as self-attached
```

---

## 6. KPI Definitions

### Current Attachment Rate

**Calculation:** (Trips with hotel attached ÷ Trips where accommodation is appropriate) × 100
**Includes:** Managed bookings + confirmed independent bookings (orphan hotel matches)
**Excludes:** Trips in Pending Assessment, day-return trips, trips where accommodation is not required
**Example:** 320 attached out of 400 eligible = 80%

### Target Attachment Rate

**Definition:** The agreed target for a TMC, corporate, or programme. Set by account management.
**Example:** 85% for TMC-wide; 90% for Corporate X (who have a strict compliance policy)

### Attachment Gap

**Calculation:** Target Rate − Current Rate
**Example:** Target 85%, Current 78% = Gap of 7 percentage points. At 400 trips/month, that is 28 trips requiring conversion.

### Monthly Improvement

**Calculation:** Current month rate − previous month rate
**Example:** May 78%, June 81% = +3% improvement

### Revenue Captured

**Calculation:** Sum of estimated commission for all attached bookings made through managed channel
**Example:** 320 bookings × £45 average commission = £14,400

### Revenue Lost

**Calculation:** Sum of estimated commission for eligible trips that departed without managed hotel
**Example:** 80 unattached trips × £45 = £3,600 lost

### Average Attachment Delay

**Calculation:** Mean time between trip creation and hotel booking (in days)
**Example:** Average 4.2 days. If grace period is 24 hours, this means most travellers book within 3 days of assessment.

### Attachment Delay Distribution

**Bands:** 0–24h, 24–48h, 48–72h, 3–7 days, 7–14 days, 14+ days
**Example:** 35% book within 24h, 25% within 48h, 20% within 72h, 15% within 7 days, 5% later.
**Business meaning:** If 60% book within 48 hours, the grace period of 24 hours eliminates most false positives while capturing genuinely delayed bookings quickly.

---

## 7. Grace Period Model

### Revised Lifecycle Flow

1. **Trip Created** — PNR arrives, trip is registered
2. **Pending Assessment** — grace period timer starts (default 24h)
3. **Grace Period Expires** — system checks for hotel booking
4. **Assessment Result:**
   - Hotel found → trip is "self-attached," no opportunity created
   - Hotel not found → opportunity created, standard scoring/prioritisation begins
5. **Opportunity Lifecycle** — as currently designed (detected → qualified → active → communicated → closed)
6. **Behaviour Analysis** — runs after assessment, not before

### Benefits of Grace Period

- Eliminates 30–40% of false-positive opportunities (travellers who book within hours)
- Reduces communication fatigue by preventing premature outreach
- Improves attachment rate accuracy (not counting trips that would self-resolve)
- Allows Behaviour Intelligence to predict based on genuine non-booking behaviour

---

## 8. Configuration Model (Future — Not MVP)

### Hierarchy

```
Platform Default (24 hours)
  └── TMC Configuration (overrides platform)
       └── Corporate Client Configuration (overrides TMC)
```

**Most specific rule wins.** If Corporate X has a 48-hour grace period configured, that applies regardless of the TMC default.

### Examples

| Level     | Entity                      | Grace Period |
| --------- | --------------------------- | ------------ |
| Platform  | Default                     | 24 hours     |
| TMC       | TMC Alpha                   | 12 hours     |
| TMC       | TMC Beta                    | 36 hours     |
| Corporate | Acme Corp (under TMC Alpha) | 48 hours     |
| Corporate | Widget Inc (under TMC Beta) | 72 hours     |

### Governance

- Platform default set by HCI product team
- TMC configuration set by TMC administrator (requires "manage configuration" permission)
- Corporate configuration set by TMC administrator with corporate client approval
- All changes logged with timestamp, user, previous value, and new value
- Configuration changes take effect on new trips only (existing pending assessments honour the grace period active at trip creation)

### Audit Requirements

- Every configuration change creates an audit entry
- Audit entries are immutable
- Configuration history is available for compliance review

---

## 9. Behaviour Intelligence Enhancements (Future)

### Predicted Attachment Window

Using historical booking behaviour per traveller, the system can predict when each individual is likely to attach a hotel. This replaces the fixed grace period with an intelligent, per-traveller window.

**Examples:**

- Traveller A: average attachment delay = 8 hours → predicted window: 12 hours
- Traveller B: average attachment delay = 3 days → predicted window: 4 days
- Traveller C: average attachment delay = 5 days → predicted window: 6 days

### How It Improves Communication Timing

Instead of a fixed 24-hour grace period followed by immediate communication, the system waits until the traveller's predicted booking window has passed. This means:

- Self-sufficient travellers (who book within hours) are never contacted
- Procrastinators (who book at day 3) receive their first outreach at day 4, not day 2
- The communication arrives when it feels relevant, not premature

### How It Reduces Unnecessary Outreach

If the model predicts with 85% confidence that Traveller A will book within 12 hours, and they do, no communication was ever sent. The system saved the cost of outreach, avoided fatigue accumulation, and the traveller experienced zero friction.

For Traveller C who typically takes 5 days: the system waits 6 days before intervening. If they book at day 4, again no outreach was needed. Only genuinely non-booking travellers receive communications — and only after their personal window has passed.

### Continuous Learning

Every booking outcome feeds back into the model:

- Booking within predicted window → reinforces prediction
- Booking outside predicted window → adjusts future predictions
- No booking after window → confirms intervention was appropriate

Over time, prediction accuracy improves from the initial 70% to 85%+, and the percentage of unnecessary communications trends toward zero.

---

## 10. Recommended Scope

### MVP Scope (Phase 1)

| Item                           | Include                     |
| ------------------------------ | --------------------------- |
| Attachment Rate KPI (current)  | Yes                         |
| Attachment Trend (monthly)     | Yes                         |
| Corporate Comparison (basic)   | Yes                         |
| Grace Period (fixed 24h)       | Yes                         |
| Pending Assessment status      | Yes                         |
| Pending Assessment KPI card    | Yes                         |
| Attachment Delay metric        | Yes                         |
| Attachment Curve (basic)       | Yes                         |
| Configuration hierarchy        | No — use fixed default      |
| Per-traveller predicted window | No — use fixed grace period |
| Cohort analysis                | No                          |
| AI-driven grace period         | No                          |

### Production Scope (Phase 2)

| Item                                       | Include |
| ------------------------------------------ | ------- |
| All MVP items                              | Yes     |
| Attachment Curve by archetype              | Yes     |
| Corporate Comparison with trends           | Yes     |
| Traveller Behaviour attachment view        | Yes     |
| Cohort Analysis                            | Yes     |
| TMC-level grace period configuration       | Yes     |
| Corporate-level grace period configuration | Yes     |
| Configuration audit trail                  | Yes     |
| Predicted Attachment Window (AI)           | Yes     |
| Per-traveller grace period                 | Yes     |
| Attachment improvement attribution         | Yes     |

---

_Document version: 1.0 — June 2026_

---

## Addendum: Design Review 2 — Additional Business Rules & Analytics

---

### BR-1005: Hotel Appropriate Trip

**Business definition:** A trip is "hotel appropriate" when the itinerary indicates overnight accommodation is required. The system must distinguish trips that genuinely need a hotel from those that do not. Only hotel-appropriate trips enter the attachment rate denominator.

A trip is hotel appropriate when:

- Trip duration exceeds 24 hours, OR
- Trip spans multiple calendar days, OR
- Arrival time is after 22:00 (late arrival requiring overnight stay), OR
- Departure time is before 07:00 the following day (early morning departure suggesting overnight prior)

A trip is NOT hotel appropriate when:

- Same-day return (depart and return within a single calendar day with duration under 16 hours)
- Day trip to a domestic destination with no overnight segment
- Cancelled trip
- Trip with confirmed alternative accommodation (e.g., staying with family — declared by traveller)

**KPI impact:** This rule defines the denominator of attachment rate. Getting it wrong inflates or deflates the metric. If day-return trips are incorrectly included as hotel-appropriate, attachment rate will appear artificially low.

**Dashboard impact:** Every dashboard showing attachment rate relies on this classification. A new KPI card should show "Hotel Appropriate Trips" as a secondary metric so users understand the base volume.

**Opportunity impact:** Only hotel-appropriate trips can generate attachment opportunities. Trips classified as not-hotel-appropriate never enter the pipeline — they are excluded at assessment.

**Behaviour Intelligence impact:** The traveller's historical trip profile (proportion of hotel-appropriate trips, typical trip duration) feeds the archetype and predicted booking window models. Travellers with many short domestic trips should not have their attachment metrics penalised by those trips.

---

### BR-1006: Partial Attachment

**Business definition:** A trip has partial attachment when a hotel booking exists but does not cover the full accommodation requirement. For example, a 4-night trip with a hotel for 2 nights has 50% partial attachment.

Partial attachment is measured as:

- Nights covered by managed hotel bookings ÷ Total nights requiring accommodation × 100

Partial attachment counts toward attachment rate as a fractional contribution:

- 4-night trip with 2-night hotel = 0.5 contribution to the numerator (not 1.0, not 0.0)

**KPI impact:** Partial attachment introduces nuance into the attachment rate. A programme may show 75% attachment rate, but if many of those are partial, the "effective" attachment (by room-nights) could be lower. A new secondary metric "Room-Night Attachment Rate" captures this.

**Dashboard impact:**

- Executive Overview: add "Room-Night Attachment Rate" alongside trip-level attachment rate
- Attachment Curve: show both trip-level and room-night-level curves
- Corporate Comparison: highlight corporates where partial attachment is common (indicating multi-city travellers who book only one leg)

**Opportunity impact:** Partial attachment creates a "Partial Coverage" opportunity type (already defined). The opportunity score should reflect the uncovered nights — 1 uncovered night is lower priority than 3 uncovered nights on the same trip.

**Behaviour Intelligence impact:** Travellers with frequent partial attachment may be multi-city travellers who book hotels city-by-city as their itinerary firms up. The system should learn this pattern and not penalise them or communicate prematurely about the second city when they have not yet confirmed their schedule.

---

### BR-1007: Orphan Hotel Treatment

**Business definition:** An orphan hotel is a hotel booking that exists in the managed channel but is not currently linked to a trip/PNR. This occurs when:

- A traveller books a hotel before their flight PNR is created
- A hotel booking arrives from a different data source than the air booking
- The matching algorithm has not yet associated the hotel to a trip

Orphan hotels count toward attachment rate:

- If an orphan hotel is subsequently matched to a trip → the trip is considered attached from the time the hotel was booked (not from the time it was matched)
- If an orphan hotel remains unmatched at departure → it does not count toward any trip's attachment

During the matching window (typically 72 hours after the hotel booking arrives), the orphan hotel is in "pending match" status.

**KPI impact:** Orphan hotels that match successfully improve attachment rate retroactively. The system must recalculate attachment metrics when a match occurs. This means attachment rate is a "living" metric that can change as orphan matching completes.

**Dashboard impact:**

- New KPI card: "Pending Orphan Matches" — hotels awaiting trip association
- Attachment Curve: orphan-matched trips should appear at the point the hotel was originally booked, not when the match occurred
- Executive Overview: show "Orphan Match Rate" (% of orphan hotels successfully matched)

**Opportunity impact:** While an orphan hotel is in "pending match" status, opportunity creation for that traveller should be suppressed. Creating an opportunity for a traveller who has already booked a hotel (just not yet matched to their trip) would be a false positive. The grace period should extend if an orphan hotel exists for that traveller.

**Behaviour Intelligence impact:** Travellers who frequently create orphan hotels (booking hotel before flight) have a booking pattern that the archetype model should recognise. These are often "hotel-first" bookers — typically procrastinators on the air side but proactive on accommodation. The system should suppress hotel compliance communications for them and instead flag if the hotel-first pattern breaks.

---

### Revenue Attribution Model

**Business definition:** Revenue attribution determines what caused a managed hotel booking to happen, for the purpose of measuring TMC intervention value. Attribution categories:

| Category                          | Definition                                                                         | Revenue Credit  |
| --------------------------------- | ---------------------------------------------------------------------------------- | --------------- |
| Self-attached                     | Traveller booked independently with no prior communication                         | 0% TMC credit   |
| Communication-attributed          | Traveller booked within the attribution window after a communication               | 100% TMC credit |
| Escalation-attributed             | Traveller booked after agent intervention                                          | 100% TMC credit |
| Orphan-matched                    | Hotel existed before opportunity was created                                       | 0% TMC credit   |
| Partial self / partial attributed | Hotel booking started independently but was completed/extended after communication | 50% TMC credit  |

**KPI impact:**

- "Revenue Protected" should only include communication-attributed and escalation-attributed bookings
- "Revenue Captured (Total)" includes all managed bookings regardless of attribution
- "TMC Value Add" = revenue from attributed bookings ÷ total eligible revenue

**Dashboard impact:**

- Executive Overview: add "TMC Value Add %" as a headline KPI
- Revenue section: break down by attribution type (pie/donut showing self vs attributed vs escalation)
- Corporate reporting: show each client what percentage of their hotel bookings were influenced by TMC intervention

**Opportunity impact:** When an opportunity is closed as "fulfilled," the attribution engine runs to determine whether the TMC's communication or the traveller's independent action caused the booking. This influences whether the opportunity counts as a "win" for the engagement programme.

**Behaviour Intelligence impact:** Attribution data feeds directly into the prediction outcome engine. If the recommended action was "do nothing" and the traveller booked independently, the prediction was correct. If the action was "send email" and the traveller booked after receiving the email, the prediction was correct AND the attribution confirms communication effectiveness for that archetype/timing combination.

---

### Executive Dashboard KPI Placement

The following KPI cards should appear on the platform-wide Executive Dashboard (visible to TMC directors and corporate travel managers):

| Position    | KPI                     | Definition                                                             |
| ----------- | ----------------------- | ---------------------------------------------------------------------- |
| 1 (primary) | Current Attachment Rate | Programme-wide % of hotel-appropriate trips with managed accommodation |
| 2           | Attachment Gap          | Target rate minus current rate — the distance to goal                  |
| 3           | Revenue Protected       | £ value of commission from TMC-attributed bookings this period         |
| 4           | Pending Assessment      | Trips awaiting grace period expiry (pipeline indicator)                |
| 5           | TMC Value Add           | % of bookings attributable to TMC communication intervention           |
| 6           | Time to Attachment      | Average days between trip creation and hotel booking                   |

These six KPIs give an executive a complete picture in 10 seconds: how good is our attachment, how far from target, how much revenue are we protecting, what's in the pipeline, how much value does TMC intervention add, and how quickly do travellers book.

---

### Time-to-Attachment Benchmarking

**Business definition:** Time-to-Attachment measures the elapsed time between trip creation and hotel booking confirmation. It answers: "How long after a trip is created does the hotel get booked?"

**Benchmarks:**

| Benchmark  | Value              | Meaning                                                                    |
| ---------- | ------------------ | -------------------------------------------------------------------------- |
| Excellent  | < 24 hours         | Traveller books hotel same session as flight — highly self-sufficient      |
| Good       | 24–72 hours        | Traveller books within 3 days — natural behaviour, low intervention needed |
| Acceptable | 3–7 days           | Booking happens within a week — may benefit from gentle reminder           |
| Concerning | 7–14 days          | Significant delay — likely needs communication intervention                |
| Critical   | > 14 days or never | Booking does not happen without escalation                                 |

**KPI impact:**

- Average Time-to-Attachment (overall, by corporate, by archetype)
- Median Time-to-Attachment (less affected by outliers)
- Time-to-Attachment Distribution (% in each band above)
- Benchmark comparison: programme average vs industry standard vs target

**Dashboard impact:**

- Attachment Trend Dashboard: overlay time-to-attachment trend alongside rate trend
- Corporate Comparison: rank corporates by average time-to-attachment (slower = more resource-intensive)
- Traveller Behaviour: individual time-to-attachment as a column in the traveller table
- New visualisation: histogram showing distribution across the bands

**Opportunity impact:** Time-to-attachment benchmarks directly inform when grace periods should expire and when first communications should be sent. If 80% of bookings for a corporate happen within 48 hours, a 24-hour grace period is appropriate. If only 40% happen within 48 hours, communications should start earlier.

**Behaviour Intelligence impact:** Per-traveller time-to-attachment is a core input to the predicted booking window. Travellers with consistent 8-hour time-to-attachment are autopilots — leave them alone. Travellers with 7+ day average are the primary targets for the engagement programme. The benchmark bands map directly to archetype classification:

- < 24h → likely autopilot or responsive
- 24–72h → likely responsive or nudge_needer
- 3–7 days → likely nudge_needer or procrastinator
- 7–14 days → likely reluctant
- > 14 days → likely chaotic or non_compliant

This creates a feedback loop: time-to-attachment data improves archetype assignment, which improves communication timing, which improves time-to-attachment.

---

_Design Review 2 — June 2026_
