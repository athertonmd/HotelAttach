# HCI Platform — Approved Architecture Decisions

Version: 1.0

Status: Approved

Date: 2026-05-31

---

## Q1 — Mantic Point Data Format and Delivery Mechanism

**Decision:** For MVP, Mantic Point delivers itinerary data via REST API webhook/POST payloads.

**Details:**

- The incoming format is treated as an external source format
- The PNR Ingestion service transforms the Mantic Point payload into the canonical HCI model
- Downstream services must not be tightly coupled to the Mantic Point source format
- Adapter layer: Inbound Mantic Point DTO → Validation → Transformation → Canonical PNR/Trip/Segment model → Event publication

---

## Q2 — BookingCreated and BookingCancelled Publisher

**Decision:** For MVP, the PNR Ingestion / Segment Management flow publishes booking lifecycle events when hotel segments are detected or cancelled.

**Details:**

- Hotel segments result in: BookingCreated, BookingUpdated, BookingCancelled
- These are canonical booking lifecycle events derived from itinerary data
- External booking systems may publish these events in future, but not in MVP

---

## Q3 — Business Rules: Database or Code

**Decision:** For MVP, business rules are implemented as versioned code/configuration files in the repository.

**Details:**

- Do not build a tenant-configurable rules database in MVP
- Each rule must reference the Business Rules Catalogue rule ID
- Design the rules engine so rules can later move to database-backed tenant configuration
- MVP rule implementation must include: rule ID, rule name, rule version, effective date, decision output, explanation/audit data

---

## Q4 — Database Topology

**Decision:** For MVP, use one Aurora PostgreSQL cluster with separate schemas per bounded context.

**Details:**

- Each service owns its schema
- No service may write to another service's schema
- Cross-service data access must use events, APIs, or read-model projections
- Future enterprise deployments may move to separate Aurora clusters if scale or isolation requires it

---

## Q5 — PolicyChanged and SupplierContractChanged Publishers

**Decision:** For MVP, the Compliance Analytics Portal publishes PolicyChanged and SupplierContractChanged events when authorised admin users change policy or supplier contract configuration.

**Details:**

- The Portal must not own all domain decisions, but it may own administrative configuration workflows
- Future integrations may allow external policy or supplier systems to publish these events

---

## Q6 — Email Sending Limits / SES Tenancy

**Decision:** For MVP, use a single platform SES account with tenant-level configuration and sending controls.

**Details:**

- Do not create a dedicated SES account per tenant
- Implement: tenant sending limits, suppression handling, bounce handling, complaint handling, branded templates, audit logging
- Design so dedicated tenant SES identities or accounts can be added later if required

---

## Q7 — Dashboard Real-Time Requirements

**Decision:** For MVP, polling is acceptable.

**Details:**

- Dashboard refresh intervals of 30–60 seconds
- Provide manual refresh
- Do not implement WebSockets or Server-Sent Events in MVP

---

## Q8 — Out-of-Order PNR Updates

**Decision:** PNR updates may arrive out of order. Implement versioned PNR processing.

**Details:**

- Every PNR update must include or be assigned a version/timestamp
- Newer versions supersede older versions
- Older versions received after newer versions must not overwrite canonical state
- All received versions must be retained in audit/history
- Event processing must be idempotent
- Use optimistic versioning where needed

---

## Q9 — Capacity Planning Assumptions

**Decision:** Use the following MVP capacity planning assumptions:

| Metric             | Volume  |
| ------------------ | ------- |
| PNRs/day           | 50,000  |
| Trips/day          | 25,000  |
| Segments/day       | 150,000 |
| Hotel bookings/day | 50,000  |
| Opportunities/day  | 10,000  |
| Communications/day | 25,000  |

**Details:**

- Architecture must be horizontally scalable and event-driven
- Do not over-optimise prematurely, but avoid design choices that would block these volumes

---

## Q10 — Analytics API Read Model

**Decision:** The analytics-api service must maintain its own read-model database.

**Details:**

- Must not query operational services in real time for dashboard data
- Pattern: EventBridge → Analytics Projections → Analytics Read Model Database → Analytics API → Compliance Analytics Portal
- Supports faster dashboards, service isolation, historical reporting, and lower coupling
