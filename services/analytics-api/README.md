# Analytics API Service

## Bounded Context

Compliance Analytics (Backend-for-Frontend)

## Purpose

Maintains read-model projections consumed by the Compliance Analytics Portal. Provides fast, pre-aggregated data for dashboards, reports, and operational views.

## Responsibilities

- Consume domain events from all operational services via EventBridge
- Project events into read-optimised database views
- Serve dashboard, opportunity, trip, traveller, compliance, supplier, and communication data to the portal
- Support filtering, pagination, and export
- Enforce tenant isolation and role-based access
- Maintain audit views

## Read Model Pattern (Approved Decision Q10)

```
EventBridge → Analytics Projections → Analytics Read Model Database → Analytics API → Portal
```

The analytics-api does NOT query operational services in real time. It maintains its own read-model database populated by event projections.

## Events Consumed

All domain events from:

- PNR Ingestion
- Trip Management
- Segment Management
- Traveller
- Booking Reconciliation
- Opportunity Detection
- Traveller Engagement

## APIs Exposed

- GET /dashboard/summary
- GET /portal/opportunities
- GET /portal/trips/{id}
- GET /portal/travellers/{id}
- GET /portal/compliance
- GET /portal/suppliers
- GET /portal/communications
- GET /portal/reports
- GET /portal/audit

## Dashboard Refresh (Approved Decision Q7)

Polling-based, 30–60 second refresh intervals. Manual refresh supported. No WebSockets in MVP.

## Database Schema

Owned tables: read-model projections (denormalised views of domain data)

## Sources

- Project 5 Specification §API Consumption
- Architecture & Integration Guide §4.8, §6.5
- Approved Decisions Q7, Q10
