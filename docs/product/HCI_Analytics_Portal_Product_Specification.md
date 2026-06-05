# HCI Compliance Analytics Portal — Product Specification

## Overview

The HCI Compliance Analytics Portal is a real-time intelligence dashboard for Travel Management Companies (TMCs) and corporate travel programmes. It provides at-a-glance visibility into hotel compliance, traveller duty of care, engagement effectiveness, and agent workload across your managed travel portfolio.

The portal is designed to help compliance managers, operations teams, and travel programme owners identify gaps, track performance, and take action before issues escalate.

---

## Navigation

The portal uses a persistent sidebar with four dashboard sections:

| Icon | Dashboard     | Purpose                                                |
| ---- | ------------- | ------------------------------------------------------ |
| 📊   | Opportunities | Pipeline of compliance opportunities requiring action  |
| 🛡️   | Duty of Care  | Traveller accommodation visibility and risk monitoring |
| 💬   | Engagement    | Communication funnel and traveller response analytics  |
| 🚨   | Escalations   | Agent workload and escalation queue management         |

---

## 1. Opportunity Operations Dashboard

**Purpose:** Monitor the active pipeline of compliance opportunities — missing hotel bookings, partial coverage gaps, policy violations, and rate savings opportunities.

### KPI Cards

| Card                     | What it shows                                                  | Why it matters                                                        |
| ------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Active Opportunities** | Total number of open (non-closed/rejected) opportunities       | Overall pipeline volume — are you keeping up?                         |
| **Critical**             | Opportunities flagged as critical priority                     | Immediate attention required — departures imminent or high-value gaps |
| **Awaiting Action**      | Opportunities in the "awaiting_action" lifecycle state         | Work items that need someone to act now                               |
| **At Risk**              | Opportunities with departure within 48 hours and no resolution | Last chance to resolve before the traveller departs unprotected       |

### Breakdown Panels

**By Priority** — Distribution of opportunities across critical, high, medium, and low priority levels. Helps you understand the severity profile of your current pipeline.

**By Type** — Distribution across opportunity types:

- **Missing hotel** — Traveller has flights but no hotel booked
- **Partial coverage** — Hotel covers only part of the trip duration
- **Policy violation** — Booking exists but doesn't meet programme policy
- **Rate opportunity** — A better rate is available for the same trip
- **Duty of care gap** — Traveller location cannot be confirmed

### Opportunity Table

A paginated, filterable list showing each opportunity with:

- **Type** — The opportunity category
- **Priority** — Severity level (critical/high/medium/low)
- **Status** — Current lifecycle state (identified, awaiting_action, communication_sent, escalated, closed, rejected)
- **Destination** — Where the traveller is going
- **Departure** — Formatted departure date
- **Est. Commission** — Estimated commission value if the booking is captured

**Filters:** Priority and lifecycle state. Use these to focus on what needs attention right now.

---

## 2. Duty of Care Dashboard

**Purpose:** Ensure your programme knows where every traveller is staying. This dashboard tracks accommodation visibility — how many trips have confirmed hotel bookings versus unresolved gaps.

### KPI Cards

| Card                      | What it shows                                          | Why it matters                                        |
| ------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| **Visibility Rate**       | Percentage of trips with confirmed accommodation       | Your programme's overall duty of care coverage        |
| **Unresolved Gaps**       | Number of trips with no confirmed hotel                | Each gap is a traveller whose location may be unknown |
| **High-Risk Unresolved**  | Unresolved trips to high-risk or critical destinations | Priority gaps based on destination risk level         |
| **Approaching Departure** | Unresolved trips departing within 7 days               | Urgent — limited time to resolve before travel        |

### Breakdown Panels

**Gaps by Destination** — Shows which cities have the most unresolved accommodation gaps. Useful for identifying patterns (e.g., a specific office location where travellers habitually book outside policy).

**Approaching Departure Table** — Lists specific trips that are departing soon with unresolved gaps, showing destination, departure date, and risk level. These need immediate action.

---

## 3. Traveller Engagement Dashboard

**Purpose:** Track how effectively your programme communicates with travellers and whether those communications lead to compliance actions (bookings, confirmations, policy acknowledgements).

### KPI Cards

| Card                    | What it shows                                           | Why it matters                                                            |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Communications Sent** | Total outbound messages across all channels             | Volume of engagement activity                                             |
| **Response Rate**       | Percentage of communications that received a response   | Are travellers engaging with your messages?                               |
| **Conversion Rate**     | Percentage of communications that resulted in a booking | The ultimate success metric — did engagement drive action?                |
| **Escalations**         | Count of communications that escalated to an agent      | High escalation counts may indicate poor automation or traveller friction |

### Breakdown Panels

**By Channel** — Distribution of communications across email, SMS, push notification, and in-app messaging. Helps optimise channel strategy.

**By Type** — What kinds of messages are being sent (missing hotel prompts, booking confirmations, policy reminders, departure alerts).

**Responses by Type** — How travellers are responding (accepted, declined, deferred, no response). High "no response" rates indicate engagement gaps.

---

## 4. Agent Escalations Dashboard

**Purpose:** Manage the human workload when automation can't resolve an opportunity. This dashboard shows the escalation queue, agent assignments, and workload distribution.

### KPI Cards

| Card                  | What it shows                             | Why it matters                                      |
| --------------------- | ----------------------------------------- | --------------------------------------------------- |
| **Pending**           | Escalations awaiting assignment or action | Queue depth — are agents keeping up?                |
| **Total Escalations** | All-time escalation count                 | Overall volume trend                                |
| **Critical**          | Escalations with critical priority        | High-urgency items needing immediate agent response |
| **Assigned**          | Escalations currently assigned to agents  | Active workload across the team                     |

### Breakdown Panels

**By Priority** — Distribution of escalations across priority levels. Helps supervisors allocate resources.

**By Reason** — Why opportunities were escalated:

- **No response** — Traveller didn't respond to automated communication
- **Departure imminent** — Too close to departure for automation to work
- **Policy escalation** — Requires human judgment on policy interpretation
- **Manual review** — Flagged for agent review by the system
- **High value trip** — Trip value exceeds automation thresholds

### Escalation Queue Table

Lists all current escalations showing reason, priority, status (pending/assigned/in_progress/resolved), and which agent is assigned.

---

## Understanding Trend Indicators

Each KPI card shows a trend arrow:

| Arrow     | Meaning                                                                          |
| --------- | -------------------------------------------------------------------------------- |
| ↑ (green) | Value increasing — positive or requires attention depending on context           |
| ↓ (red)   | Value decreasing — may indicate improvement (e.g., fewer escalations) or concern |
| → (grey)  | Stable — no significant change from the previous period                          |

**Context matters:** A green ↑ on "Active Opportunities" means your pipeline is growing (more work to do), while a green ↑ on "Visibility Rate" means coverage is improving (good news).

---

## Understanding Priority Levels

| Priority | Colour | Meaning                                                                |
| -------- | ------ | ---------------------------------------------------------------------- |
| Critical | Red    | Requires immediate action — departure imminent or high business impact |
| High     | Orange | Should be addressed within 24 hours                                    |
| Medium   | Amber  | Standard priority — address within normal workflow                     |
| Low      | Green  | Informational or low urgency — address when capacity allows            |

---

## Understanding Lifecycle States

Opportunities move through these states:

1. **Identified** — System has detected the opportunity
2. **Awaiting Action** — Ready for engagement or agent action
3. **Communication Sent** — Automated message sent to traveller
4. **Escalated** — Assigned to a human agent
5. **Closed** — Successfully resolved (booking made, gap filled)
6. **Rejected** — Determined to be invalid or no longer relevant

---

## Data & Filtering

- All data is scoped to your tenant (TMC or corporate)
- Opportunity table supports **priority** and **status** filters
- Tables are paginated (10 items per page)
- Currency is displayed in GBP
- Dates are formatted as day-month-year (e.g., 15 Jul 2025)

---

## Current Limitations (Phase 1)

- Data refreshes on page load (no auto-refresh yet)
- No date range filtering
- No CSV/Excel export
- No drill-down to individual traveller profiles
- No real-time notifications
- Charts and visualisations planned for Phase 2

---

## Glossary

| Term                | Definition                                                         |
| ------------------- | ------------------------------------------------------------------ |
| **Opportunity**     | A detected compliance gap or revenue opportunity                   |
| **Duty of Care**    | Organisational responsibility to know where travellers are staying |
| **Visibility Rate** | Percentage of trips with confirmed accommodation                   |
| **Escalation**      | An opportunity that requires human agent intervention              |
| **Conversion Rate** | Percentage of communications resulting in a booking action         |
| **Coverage**        | Whether a trip's hotel needs are fully met                         |
