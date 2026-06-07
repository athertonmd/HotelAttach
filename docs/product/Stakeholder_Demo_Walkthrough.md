# HCI Compliance Analytics Portal — Stakeholder Demo Walkthrough

## Duration: 15 Minutes

## Audience Profiles

| Stakeholder              | Primary Interest                                      | Key Question                                             |
| ------------------------ | ----------------------------------------------------- | -------------------------------------------------------- |
| TMC Managing Director    | Revenue, programme health, client retention           | "Is this making us money and keeping clients?"           |
| Head of Operations       | Workload, efficiency, team utilisation                | "Where should my team focus today?"                      |
| Corporate Travel Manager | Policy compliance, traveller experience, cost control | "Are my travellers booking correctly and are they safe?" |

---

## Recommended Click Path

```
Hotel Attachment (2.5 min)
    → Opportunities (2.5 min)
        → Duty of Care (2.5 min)
            → Engagement (2.5 min)
                → Escalations (2 min)
                    → Behaviour Intelligence (3 min)
```

**Why this order:** Start with the primary commercial KPI (attachment rate), flow through the operational pipeline that drives it, demonstrate traveller safety, show communication effectiveness, surface problems that need human intervention, and finish with the AI layer that ties everything together.

---

## Opening (30 seconds)

_"This portal gives you a single view of your hotel compliance programme. Every screen answers a different business question. We'll walk through all six dashboards in order, starting with the one that matters most commercially — hotel attachment rate."_

**Note for presenter:** Point out the Demo Data badge and explain all figures are illustrative. The role selector in the bottom-left shows how different user types see different dashboards.

---

## 1. Hotel Attachment 🏨

**Route:** `/analytics/hotel-attachment`
**Time:** 2.5 minutes

### What problem it solves

TMCs lose revenue when travellers book flights but not hotels through managed channels. Today there is no visibility into how bad the problem is, which clients are worst, or whether it is improving. This dashboard answers: "What percentage of trips have a hotel attached, and where are the gaps?"

### KPI to look at first

**Attachment Rate (hero card): 78%**

This is the programme-wide percentage of hotel-appropriate trips with managed accommodation. It sits front and centre because it is the single number that determines hotel commission revenue.

### What to show on screen

1. **Hero KPI** — "78% of eligible trips have hotels attached. Target is 85%, so we have a 7% gap."
2. **Revenue Opportunity** — "That gap represents £12,600 in lost commission this period."
3. **Pending Assessment** — "12 trips are inside the 24-hour grace period — we deliberately wait before contacting travellers who may still be booking."
4. **Attachment Curve** — "This shows when travellers naturally book. Most attachment happens in the final 7 days before departure. Communicating on day one wastes effort."
5. **Corporate Comparison** — "Sorted worst-first. Global Finance is 14 points below target. This is the client conversation to have this week."
6. **Delay Distribution** — "35% of hotels are booked within 24 hours. This validates our grace period — without it, we'd be chasing travellers who were always going to book."

### Actions to take

| Role                     | Action                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Managing Director        | Review revenue gap in monthly board pack. Set target improvement for next quarter.              |
| Head of Operations       | Schedule account review with Global Finance. Reallocate resource to worst-performing clients.   |
| Corporate Travel Manager | Share attachment rate with travel programme sponsors. Identify departments with low compliance. |

### Expected business benefit

- Quantified revenue opportunity per client — supports pricing conversations
- Reduced false-positive outreach through grace period — fewer unnecessary communications
- Evidence-based account management — focus effort where the gap is largest

---

## 2. Opportunities 📊

**Route:** `/analytics/opportunities`
**Time:** 2.5 minutes

### What problem it solves

When a trip has no hotel attached (after the grace period), it becomes an opportunity. Operations teams currently manage these via spreadsheets or email queues with no prioritisation. This dashboard answers: "How many actionable opportunities exist right now, and which ones matter most?"

### KPI to look at first

**Active Opportunities: 47**

This is the current workload. Combined with the priority breakdown, it tells operations exactly how many items need attention today.

### What to show on screen

1. **Active count** — "47 opportunities are live right now."
2. **Critical count** — "8 are critical — departing soon with high-value bookings."
3. **By Priority breakdown** — "Critical and high should be the morning focus. Medium and low can wait."
4. **By Type breakdown** — "Missing Hotel is the most common. Partial Coverage means they booked for some nights but not all."
5. **Opportunity list** — "Each row shows traveller, destination, departure date, estimated commission, and current state."

### Actions to take

| Role                     | Action                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Managing Director        | Monitor critical count trend. Rising = programme not working. Falling = interventions are effective. |
| Head of Operations       | Assign critical opportunities to senior agents first thing. Use priority to allocate workload.       |
| Corporate Travel Manager | Review opportunity volume per corporate to understand compliance gaps by department.                 |

### Expected business benefit

- Prioritised worklist replaces manual triage — saves 30+ minutes per agent per day
- Critical opportunities surface automatically — no more missed departures
- Revenue impact visible per opportunity — agents focus on highest-value items first

---

## 3. Duty of Care 🛡️

**Route:** `/analytics/duty-of-care`
**Time:** 2.5 minutes

### What problem it solves

Corporates have a legal duty of care to know where their travellers are. When a trip has no hotel, the company cannot locate the employee in an emergency. This dashboard answers: "Do we know where every traveller is sleeping tonight?"

### KPI to look at first

**Visibility Rate: 87%**

This is the percentage of active trips where the TMC knows the traveller's overnight location. 100% is the target — anything below means there are people travelling who cannot be located.

### What to show on screen

1. **Visibility Rate** — "87% means we know where 87 out of every 100 travellers are. The remaining 13% are gaps."
2. **Unresolved Gaps** — "These are trips with no confirmed overnight location."
3. **High-Risk Unresolved** — "Trips to high-risk destinations without confirmed accommodation. These are the priority."
4. **Approaching Departures** — "Trips departing in the next 48 hours with gaps — last chance to resolve before they travel."
5. **Approaching departure list** — "Each row shows who, where, when, and risk level."

### Actions to take

| Role                     | Action                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Managing Director        | Report visibility rate to corporate clients as a duty of care KPI in quarterly business reviews. |
| Head of Operations       | Ensure high-risk unresolved gaps are actioned same-day. Approaching departures are urgent.       |
| Corporate Travel Manager | Share with security/HR teams. Flag high-risk destinations for immediate follow-up.               |

### Expected business benefit

- Demonstrates compliance with duty of care obligations — reduces corporate liability
- Automated risk flagging replaces manual daily checks
- Provides auditable evidence that the TMC is actively managing traveller safety

---

## 4. Engagement 💬

**Route:** `/analytics/engagement`
**Time:** 2.5 minutes

### What problem it solves

The platform sends communications (emails, app notifications) to travellers about missing hotels. Without measurement, there is no way to know if communications are working or just annoying people. This dashboard answers: "Are our communications effective?"

### KPI to look at first

**Response Rate: 42%**

This tells you what proportion of travellers acknowledged or acted on a communication. Below 30% suggests communications are being ignored. Above 50% indicates strong engagement.

### What to show on screen

1. **Communications Sent** — "1,250 communications sent this period across all channels."
2. **Response Rate: 42%** — "Nearly half of travellers responded — good engagement."
3. **Conversion Rate: 18%** — "18% of communications resulted in a hotel booking. This is the revenue-generating metric."
4. **Escalations: 24** — "24 travellers did not respond after multiple attempts and were escalated to an agent."
5. **By Channel** — "Email vs app notification performance comparison."

### Actions to take

| Role                     | Action                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Managing Director        | Track conversion rate monthly. This directly measures revenue generated per communication.                           |
| Head of Operations       | If response rate drops, review communication templates and timing. High escalations = communications aren't landing. |
| Corporate Travel Manager | Review which channels your travellers prefer. Consider whether communication frequency is appropriate.               |

### Expected business benefit

- Measures ROI of every communication sent — justifies programme investment
- Identifies when to stop communicating (diminishing returns)
- Compares channel effectiveness — invest in what works

---

## 5. Escalations 🚨

**Route:** `/analytics/escalations`
**Time:** 2 minutes

### What problem it solves

When automated communications fail, human agents must intervene. This dashboard answers: "What needs a human right now?"

### KPI to look at first

**Pending Escalations: 18**

This is the current human workload — items that automation could not resolve and require agent intervention.

### What to show on screen

1. **Pending count** — "18 escalations need human action."
2. **Critical count** — "5 are critical — high-value or departing imminently."
3. **By Reason** — "Shows why escalation happened: no response, VIP traveller, repeated non-compliance."
4. **By Priority** — "Helps agents prioritise their queue."
5. **Escalation list** — "Individual items with traveller, reason, priority, and assigned agent."

### Actions to take

| Role                     | Action                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Managing Director        | Monitor escalation volume trend. Rising = programme needs improvement. Falling = automation is handling more. |
| Head of Operations       | Ensure critical escalations are assigned and actioned within SLA. Review agent capacity vs volume.            |
| Corporate Travel Manager | Understand why your travellers are escalating. Repeated names suggest policy training is needed.              |

### Expected business benefit

- Clear agent workload visibility — no hidden queues
- Priority-based routing ensures high-value items get attention first
- Trend analysis shows whether the programme is reducing manual effort over time

---

## 6. Behaviour Intelligence 🧠

**Route:** `/analytics/behaviour`
**Time:** 3 minutes

### What problem it solves

Every traveller books differently. Some always book immediately. Some always need reminding. Some have become fatigued by too many messages. This dashboard answers: "How should we treat each individual traveller?"

### KPI to look at first

**Archetype Distribution**

This shows how the traveller population breaks down: autopilots (need no help), responsive (react to one nudge), procrastinators (need reminders), reluctant (resist), chaotic (unpredictable). The mix determines how much operational effort the programme requires.

### What to show on screen

1. **Archetype breakdown** — "40% are autopilots — they never need contact. 25% are responsive — one message works. Only 15% are procrastinators who need multiple reminders."
2. **Fatigue levels** — "Shows how many travellers are approaching communication overload. High-fatigue travellers should receive fewer messages."
3. **Revenue at risk** — "Quantifies the revenue associated with travellers who are unlikely to book without intervention."
4. **Prediction accuracy** — "The system's recommendation engine is 76% accurate — it correctly predicts whether a traveller will book independently or needs help."

### Actions to take

| Role                     | Action                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managing Director        | Use archetype mix in client proposals — "40% of your travellers are self-sufficient, so our programme focuses resource on the 35% who need it."                 |
| Head of Operations       | Suppress communications to high-fatigue travellers. Focus effort on procrastinators and reluctant — that's where ROI lives.                                     |
| Corporate Travel Manager | Understand your traveller population. If most are autopilots, the programme cost should be lower. If many are procrastinators, expect more engagement activity. |

### Expected business benefit

- Personalised treatment per traveller — right message, right time, right channel
- Reduced fatigue — travellers who don't need help aren't contacted
- Prediction improves over time — more automation, less manual effort
- Revenue at risk quantifies the commercial case for intervention

---

## Closing (30 seconds)

_"What you've seen is a complete intelligence layer over the hotel compliance programme. It starts with the commercial headline — attachment rate — and works down through opportunities, safety, communications, escalations, and individual traveller behaviour. Every dashboard answers a specific business question, and every KPI drives a specific action._

_This is running on mock data today. Once connected to the Mantic Point Itinerary Store, these numbers become real. The architecture is ready — we need to agree scope and timeline for live data integration."_

---

## Role-Specific Talking Points

### For the TMC Managing Director

- "Attachment rate is your revenue headline — 78% means 22% is lost commission."
- "Revenue Opportunity quantifies the gap in pounds."
- "Corporate comparison gives you the account review agenda."
- "Behaviour Intelligence tells you which travellers will never need help — so you can price accordingly."

### For the Head of Operations

- "Opportunities are your team's prioritised to-do list."
- "Escalations show exactly what needs a human today."
- "Engagement metrics tell you if your templates and timing are working."
- "Fatigue monitoring prevents your team from burning out travellers with too many messages."

### For the Corporate Travel Manager

- "Duty of Care proves you know where your people are."
- "Attachment rate shows policy compliance across your programme."
- "The grace period means your travellers aren't hassled when they were always going to book."
- "Behaviour Intelligence means low-maintenance travellers are left alone — better experience for everyone."

---

## Demo Tips

1. **Start with the role selector** — show that different roles see different dashboards
2. **Use the Demo Data badge** — set expectations that figures are illustrative
3. **Click through the sidebar** — natural left-to-right flow
4. **Pause on the hero KPI** — let the number land before explaining context
5. **Point out the worst-first sorting** — shows the portal is designed for action, not just reporting
6. **End on Behaviour Intelligence** — it's the differentiator that makes the platform intelligent rather than just a dashboard

---

_Document version: 1.0 — June 2026_
