# HCI Project 3 -- Opportunity Detection Engine

## Product & Technical Specification

### Purpose

The Opportunity Detection Engine continuously evaluates trips to
determine whether accommodation is required, whether accommodation
exists, and whether intervention should occur.

The engine transforms travel data into actionable revenue, compliance,
supplier attainment and duty of care opportunities.

# Business Objective

Identify situations where:

Accommodation is likely required

Accommodation is missing

Accommodation is outside programme

Supplier commitments are at risk

Duty of care visibility is incomplete

The engine must prioritise opportunities based on business value and
traveller impact.

# Business Questions

The engine must answer:

## Question 1

Does this trip require accommodation?

## Question 2

Does accommodation already exist?

## Question 3

Is accommodation compliant?

## Question 4

Should traveller intervention occur?

## Question 5

What is the value of the opportunity?

# Scope

## In Scope

Hotel requirement determination

Opportunity scoring

Compliance evaluation

Supplier contract evaluation

Duty of care assessment

Opportunity lifecycle management

Business rule management

Event publishing

Audit logging

## Out of Scope

Traveller communications

Hotel booking workflow

Analytics dashboards

Machine learning optimisation

# Core Responsibilities

The service shall:

Evaluate every trip.

Determine accommodation requirement.

Determine accommodation status.

Calculate opportunity value.

Prioritise opportunities.

Publish opportunity events.

# Opportunity Types

## Missing Hotel

Traveller likely requires accommodation.

No hotel identified.

## Partial Hotel Coverage

Hotel exists.

Coverage less than trip duration.

## Non-Preferred Hotel

Hotel exists.

Not in approved programme.

## Supplier Leakage

Hotel booked outside contracted suppliers.

## Duty Of Care Gap

Traveller destination known.

Accommodation location unknown.

## Contract Attainment Risk

Corporate hotel commitments unlikely to be achieved.

# Functional Requirements

## FR1 -- Hotel Requirement Evaluation

Determine:

{ "hotelRequired": true, "confidence": 95 }

### Inputs

Trip duration

Destination

Flight schedule

Rail schedule

Traveller history

Corporate policy

Country

City

Trip type

### Example Rules

Same-day return

Hotel Required = No

Trip duration greater than 24 hours

Hotel Required = Yes

Arrival 22:00

Departure 06:00 next day

Hotel Required = Yes

International trip

More than one night

Hotel Required = Yes

# FR2 -- Accommodation Status Evaluation

Determine:

Full Coverage

Partial Coverage

No Coverage

Unknown

Output

{ "coveragePercent": 100, "status": "FULL" }

# FR3 -- Compliance Evaluation

Determine whether accommodation meets corporate requirements.

### Policy Types

Preferred chain

Preferred supplier

Maximum nightly rate

Location restrictions

Risk restrictions

Sustainability requirements

### Output

{ "compliant": false, "reasonCodes": \[ "NON_PREFERRED_SUPPLIER" \] }

# FR4 -- Opportunity Scoring

Generate a prioritised score.

Range:

0--100

### Scoring Components

Hotel requirement confidence

Compliance severity

Trip value

Traveller importance

Supplier commitment impact

Duty of care impact

Revenue opportunity

Time to departure

### Example

{ "score": 92, "priority": "CRITICAL" }

# Opportunity Priorities

Critical

80-100

High

60-79

Medium

40-59

Low

0-39

# FR5 -- Revenue Opportunity Calculation

Estimate recoverable hotel value.

Inputs

Destination

Trip duration

Historical ADR

Corporate hotel programme rates

Traveller profile

Output

{ "estimatedRoomNights": 4, "estimatedSpend": 720,
"estimatedCommission": 72 }

# FR6 -- Supplier Contract Evaluation

Measure impact against supplier commitments.

Example

Corporate Commitment

Marriott

1000 nights

Current Forecast

920 nights

Gap

80 nights

Output

{ "supplier": "Marriott", "riskLevel": "HIGH", "shortfall": 80 }

# FR7 -- Duty Of Care Evaluation

Determine accommodation visibility.

Status Levels

Known

Partially Known

Unknown

Output

{ "dutyOfCareStatus": "UNKNOWN" }

# Opportunity Lifecycle

Detected

↓

Qualified

↓

Communicated

↓

Converted

↓

Closed

Alternative States

Rejected

Expired

Cancelled

# Continuous Reassessment

Every event shall trigger reevaluation.

Events

Trip Updated

Hotel Added

Hotel Removed

Hotel Matched

Policy Changed

Supplier Contract Changed

Trip Cancelled

Traveller Changed

# Event Publishing

## OpportunityCreated

{ "opportunityId": "","tripId": "","type": "MISSING_HOTEL", "score": 92
}

## OpportunityUpdated

{ "opportunityId": "","oldScore": 72, "newScore": 91 }

## OpportunityClosed

{ "opportunityId": "","reason": "HOTEL_ADDED" }

# API Requirements

## POST /opportunities/evaluate

Force evaluation.

## GET /opportunities

List opportunities.

## GET /opportunities/{id}

Retrieve opportunity.

## GET /opportunities/high-priority

Priority queue.

## GET /opportunities/contracts

Contract attainment opportunities.

# Database Design

## Opportunities

opportunity_id

tenant_id

corporate_id

trip_id

opportunity_type

score

priority

status

created_at

updated_at

## Opportunity Scores

score_id

opportunity_id

component

score

weight

created_at

## Contract Risks

risk_id

supplier_id

corporate_id

forecast_nights

committed_nights

gap

risk_level

## Duty Of Care Assessments

assessment_id

trip_id

status

confidence

created_at

# AWS Architecture

EventBridge

↓

Opportunity Engine Lambda

↓

Aurora PostgreSQL

↓

EventBridge

↓

Downstream Services

# Non-Functional Requirements

Evaluation Time

\<2 seconds

Event Processing

\<30 seconds

Availability

99.9%

Audit Coverage

100%

# MVP Deliverables

Hotel Requirement Engine

Compliance Engine

Opportunity Scoring Engine

Revenue Estimator

Duty Of Care Assessor

Contract Risk Engine

Event Publisher

Audit Service

# Success Criteria

Every active trip is evaluated.

Hotel requirement is determined.

Accommodation coverage is assessed.

Compliance status is calculated.

Revenue opportunity is estimated.

Duty of care status is calculated.

Supplier contract impact is assessed.

A prioritised opportunity is generated.

The Traveller Engagement Platform can consume opportunities and initiate
recovery workflows.
