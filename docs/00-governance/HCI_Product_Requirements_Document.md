# Hotel Compliance Intelligence (HCI)

## Product Requirements Document (PRD)

Version: 1.0

Status: Authoritative Product Definition

Owner: Product Management

---

# 1. Executive Summary

Hotel Compliance Intelligence (HCI) is a SaaS platform designed for Travel Management Companies (TMCs) and Corporates.

The platform identifies missing hotel bookings, improves hotel programme compliance, increases supplier contract attainment, improves duty of care coverage and generates additional hotel revenue opportunities.

The platform uses itinerary data, hotel booking data, supplier contract data and traveller engagement workflows to identify opportunities and drive corrective action.

---

# 2. Product Vision

Provide the travel industry with the leading hotel compliance and recovery platform by transforming fragmented travel and accommodation data into actionable intelligence.

---

# 3. Problem Statement

Corporates and TMCs face several challenges:

- Missing hotel bookings
- Poor duty of care visibility
- Low supplier programme attainment
- Hotel leakage
- Manual compliance monitoring
- Limited traveller engagement
- Lost commission revenue

Existing systems identify bookings but do not actively detect and recover opportunities.

---

# 4. Business Objectives

The platform must:

1. Increase hotel attachment rates.
2. Improve duty of care coverage.
3. Improve supplier contract attainment.
4. Reduce hotel leakage.
5. Recover lost hotel commission opportunities.
6. Improve traveller compliance.
7. Reduce operational effort.

---

# 5. Target Customers

## Primary

- Travel Management Companies (TMCs)

## Secondary

- Corporate Travel Departments
- Corporate Procurement Teams
- Travel Programme Managers

---

# 6. User Personas

## TMC Administrator

Responsible for:

- Customer management
- Opportunity settings
- Reporting
- Compliance monitoring

## TMC User

Responsible for:

- Traveller support
- Opportunity management
- Escalation handling

## Corporate Administrator

Responsible for:

- Travel policy
- Supplier programmes
- Compliance reporting

## Corporate User

Responsible for:

- Monitoring compliance
- Reviewing opportunities

---

# 7. Product Scope

## In Scope

- Itinerary ingestion
- Traveller management
- Trip management
- Hotel reconciliation
- Opportunity detection
- Traveller engagement
- Compliance analytics
- Reporting
- Audit management
- Supplier attainment monitoring

## Out of Scope

- Hotel booking fulfilment
- GDS functionality
- Expense management
- Inventory management
- Travel booking creation

---

# 8. Product Architecture

The platform consists of six projects.

## Project 1

Itinerary Intelligence Platform

Purpose:

Create canonical traveller, trip, PNR and segment records.

## Project 2

Booking Reconciliation Engine

Purpose:

Determine whether accommodation already exists.

## Project 3

Opportunity Detection Engine

Purpose:

Identify missing hotel, compliance and supplier opportunities.

## Project 4

Traveller Engagement Platform

Purpose:

Communicate with travellers and capture responses.

## Project 5

Compliance Analytics Portal

Purpose:

Provide operational dashboards and reporting.

## Project 6

Behavioural Intelligence & Optimisation Engine

Purpose:

Provide predictive and optimisation capabilities.

---

# 9. MVP Definition

The MVP includes:

- Project 1
- Project 2
- Project 3
- Project 4
- Project 5

Project 6 is excluded from MVP.

---

# 10. Success Metrics

## Compliance

- Increase hotel compliance rate
- Reduce hotel leakage

## Revenue

- Increase hotel attachment
- Increase recoverable commission

## Duty of Care

- Increase accommodation visibility
- Reduce unknown accommodation events

## Operational Efficiency

- Reduce manual intervention
- Increase automated opportunity processing

---

# 11. Technology Standards

Authentication:
AWS Cognito

Database:
Aurora PostgreSQL

Event Bus:
AWS EventBridge

Storage:
Amazon S3

Messaging:
Amazon SES

Frontend:
React + TypeScript

API Style:
REST + JWT

---

# 12. Governance

All implementations must follow:

1. Programme Steering Document
2. Architecture & Integration Guide
3. Business Rules Catalogue
4. Project Specifications
5. JSON Event Schemas

---

# 13. Multi-Tenant Requirements

Mandatory:

- Tenant isolation
- Role-based access control
- Audit logging
- Data encryption at rest
- Data encryption in transit

---

# 14. Roadmap

## Phase 1

Project 1 – Itinerary Intelligence

Project 2 – Booking Reconciliation

## Phase 2

Project 3 – Opportunity Detection

## Phase 3

Project 4 – Traveller Engagement

## Phase 4

Project 5 – Compliance Analytics Portal

## Phase 5

Project 6 – Behavioural Intelligence

---

# 15. Definition of Success

The platform is successful when:

- Trips are automatically created from itinerary data.
- Hotel coverage is accurately identified.
- Missing hotel opportunities are detected.
- Travellers can be engaged automatically.
- Compliance can be monitored centrally.
- Supplier commitments can be tracked.
- Revenue recovery opportunities are visible.
- All decisions are auditable.
