# Opportunity Detection Service

## Bounded Context

Opportunity Detection

## Purpose

Continuously evaluates trips to detect missing, partial, or non-compliant hotel opportunities. Scores and prioritises opportunities for downstream engagement.

## Responsibilities

- Evaluate hotel requirement for every trip (BR-100 rules)
- Determine accommodation status (coverage from reconciliation)
- Evaluate compliance against corporate policies (BR-400)
- Score opportunities (BR-600 weighted components)
- Estimate revenue opportunity
- Assess supplier contract risk (BR-800)
- Assess duty-of-care status (BR-700)
- Manage opportunity lifecycle (Detected → Qualified → Communicated → Converted → Closed)
- Continuously reassess on lifecycle events
- Publish opportunity events

## Opportunity Types

- Missing Hotel (BR-501)
- Partial Hotel Coverage (BR-502)
- Non-Preferred Supplier (BR-503)
- Supplier Leakage (BR-504)
- Duty of Care Gap (BR-505)
- Supplier Contract Risk (BR-506)

## Business Rules Implementation (Approved Decision Q3)

Rules are implemented as versioned code/configuration files. Each rule references its Business Rules Catalogue ID. Designed for future migration to database-backed tenant configuration.

## Events Consumed

- TripCreated, TripUpdated
- HotelMatched, HotelRejected, HotelCoverageUpdated
- SegmentAdded, SegmentUpdated, SegmentRemoved
- PolicyChanged, SupplierContractChanged

## Events Published

- OpportunityCreated
- OpportunityUpdated
- OpportunityClosed
- OpportunityEscalated

## Database Schema

Owned tables: `opportunities`, `opportunity_scores`, `contract_risks`, `duty_of_care_assessments`

## Capacity

- 10,000 opportunities/day
- Evaluation time <2 seconds

## Sources

- Project 3 Specification
- Architecture & Integration Guide §4.6
- Business Rules Catalogue BR-100, BR-400, BR-500, BR-600, BR-700, BR-800
- Approved Decision Q3
