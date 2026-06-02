# Hotel Compliance Intelligence (HCI) Platform

A multi-tenant SaaS platform for Travel Management Companies (TMCs) and Corporates that identifies missing hotel bookings, improves hotel programme compliance, increases supplier contract attainment, improves duty of care coverage, and generates additional hotel revenue opportunities.

## Architecture

Event-driven microservices platform built on AWS.

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Runtime        | Node.js 22 + TypeScript                                 |
| Compute        | AWS Lambda                                              |
| Database       | Aurora PostgreSQL (shared cluster, per-service schemas) |
| Event Bus      | AWS EventBridge                                         |
| Authentication | AWS Cognito                                             |
| Email          | Amazon SES                                              |
| Frontend       | React + TypeScript + Material UI                        |
| CDN            | CloudFront                                              |
| IaC            | AWS CDK                                                 |

## Repository Structure

```
├── docs/              Governance, architecture, project specifications
├── schemas/           JSON Schema event contracts (source of truth)
├── packages/          Shared libraries
│   ├── shared-types/      Domain interfaces, enums, value objects
│   ├── event-contracts/   Event envelope, types, publisher/consumer abstractions
│   ├── validation/        JSON Schema validation (Ajv)
│   └── observability/     Logging, correlation IDs, metrics
├── services/          Backend domain services
│   ├── pnr-ingestion/
│   ├── trip-management/
│   ├── segment-management/
│   ├── traveller/
│   ├── booking-reconciliation/
│   ├── opportunity-detection/
│   ├── traveller-engagement/
│   └── analytics-api/
├── apps/              Frontend applications
│   └── compliance-analytics-portal/
├── infrastructure/    AWS CDK stacks
└── tests/             Cross-service tests
    ├── contract-tests/
    ├── integration-tests/
    └── fixtures/
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## MVP Scope

Projects 1–5 are in scope for MVP. Project 6 (Behavioural Intelligence) is post-MVP.

| Phase              | Services                                                      |
| ------------------ | ------------------------------------------------------------- |
| 1 — Foundation     | Shared packages, schemas, event utilities                     |
| 2 — Core Itinerary | PNR Ingestion, Trip Management, Segment Management, Traveller |
| 3 — Reconciliation | Booking Reconciliation Engine                                 |
| 4 — Opportunities  | Opportunity Detection Engine                                  |
| 5 — Engagement     | Traveller Engagement Platform                                 |
| 6 — Portal         | Compliance Analytics Portal + Analytics API                   |

## Key Architectural Principles

1. Events are the source of integration between services.
2. Each service owns its own database schema — no cross-service writes.
3. APIs serve synchronous user actions and UI queries.
4. The portal does not own domain decisions.
5. Every important decision must be explainable and auditable.
6. Tenant isolation is mandatory on every record and event.
7. Existing JSON schemas are the source of truth for event contracts.
8. Build in small, testable increments.

## Governance

All implementations must follow:

1. Programme Steering Document
2. Architecture & Integration Guide
3. Business Rules Catalogue
4. Project Specifications
5. JSON Event Schemas
6. Approved Architecture Decisions (see below)

## Approved Architecture Decisions

| #   | Decision                 | Summary                                                                            |
| --- | ------------------------ | ---------------------------------------------------------------------------------- |
| Q1  | Mantic Point Integration | REST webhook, adapter layer transforms external DTO → canonical model              |
| Q2  | BookingCreated Publisher | PNR Ingestion / Segment Management publishes booking lifecycle events              |
| Q3  | Business Rules           | Versioned code/config in repo; designed for future DB-backed tenant config         |
| Q4  | Database Topology        | One Aurora cluster, separate schemas per bounded context                           |
| Q5  | Policy/Contract Events   | Portal publishes PolicyChanged, SupplierContractChanged on admin actions           |
| Q6  | SES Tenancy              | Single platform SES account with tenant-level controls                             |
| Q7  | Dashboard Refresh        | Polling (30–60s), no WebSockets in MVP                                             |
| Q8  | Out-of-Order PNRs        | Versioned processing, idempotent, older versions never overwrite newer             |
| Q9  | Capacity                 | 50K PNRs, 25K trips, 150K segments, 50K bookings, 10K opportunities, 25K comms/day |
| Q10 | Analytics Read Model     | Own database, event-projected, no real-time queries to operational services        |
