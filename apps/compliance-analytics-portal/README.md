# Compliance Analytics Portal

## Bounded Context

Compliance Analytics (Frontend)

## Purpose

The operational command centre for the Hotel Compliance Intelligence platform. Provides TMCs and Corporates with dashboards, opportunity management, compliance monitoring, supplier tracking, and audit visibility.

## Technology

- React + TypeScript
- Material UI
- AG Grid (data tables)
- Charting library (TBD)
- AWS Amplify (hosting)
- Amazon Cognito (authentication)
- CloudFront (CDN)

## Portal Modules

1. **Dashboard** — KPIs, open opportunities, revenue recovery, compliance rates
2. **Opportunities** — List, detail, assign, escalate, close, override
3. **Trips** — Trip detail, timeline, accommodation status
4. **Travellers** — Profile, travel history, compliance history
5. **Compliance** — Hotel attachment, preferred supplier usage, policy violations
6. **Supplier Contracts** — Attainment tracking, risk levels, forecasting
7. **Communications** — Sent, delivered, opened, responded, converted
8. **Reports** — Standard reports, CSV/Excel/PDF export
9. **Administration** — Tenant, user, corporate, policy management
10. **Audit** — User actions, opportunity changes, system events

## Multi-Tenant Security

- Tenant isolation mandatory
- Role-based access control (Platform Admin, TMC Admin, TMC User, Corporate Admin, Corporate User)
- Users access only their tenant, assigned corporates, and role-permitted data

## Event Publishing (Approved Decision Q5)

The portal publishes:

- PolicyChanged (when admin changes travel/hotel policies)
- SupplierContractChanged (when admin changes supplier contracts)

## Dashboard Refresh (Approved Decision Q7)

Polling-based, 30–60 second intervals. Manual refresh. No WebSockets in MVP.

## Data Source

Consumes the Analytics API service (read-model projections). Does NOT query operational services directly.

## Non-Functional Requirements

- Page load: <2 seconds
- Dashboard refresh: <5 seconds
- Availability: 99.9%
- Accessibility: WCAG 2.1 AA
- Audit retention: 7 years

## Sources

- Project 5 Specification
- Architecture & Integration Guide §4.8
- Approved Decisions Q5, Q7, Q10
