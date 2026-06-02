# HCI Project 2 -- Booking Reconciliation Engine

## Product & Technical Specification

### Purpose

The Booking Reconciliation Engine identifies accommodation bookings that
exist outside the originating trip record.

The engine evaluates incoming hotel bookings and determines whether they
belong to an existing trip.

Its purpose is to prevent false compliance alerts and improve the
accuracy of duty of care reporting.

# Business Objective

Determine:

"Does accommodation already exist for this trip?"

before generating any missing hotel opportunity.

The engine must continuously reassess booking relationships throughout
the booking lifecycle.

# Business Problem

A traveller may book:

Flight PNR

and later

Hotel PNR

through:

Different agent

Different channel

Different supplier

Online booking tool

Hotel programme portal

These records may never be linked by the source systems.

Without reconciliation the platform will incorrectly identify a missing
hotel.

# Scope

## In Scope

Hotel matching

Traveller matching

Trip matching

Confidence scoring

Match lifecycle management

Booking reassessment

Audit history

Event publication

## Out of Scope

Compliance scoring

Traveller communications

Hotel recommendations

Reporting dashboards

Machine learning optimisation

# Core Responsibilities

The engine shall:

Receive hotel booking events.

Search candidate trips.

Calculate match confidence.

Determine relationship.

Maintain reconciliation state.

Publish reconciliation events.

# Matching Philosophy

Matching is probabilistic.

The engine never assumes certainty.

Every relationship receives a confidence score.

0-100

Example:

100 = Exact Match

85 = Highly Likely

60 = Possible Match

30 = Weak Match

0 = No Match

# Matching Inputs

## Traveller Information

First Name

Last Name

Email

Mobile Number

Employee ID

Corporate ID

Traveller Profile ID

## Hotel Information

Hotel Name

Hotel Chain

Address

City

Country

Check-In Date

Check-Out Date

Booking Date

Confirmation Number

## Trip Information

Trip ID

Traveller ID

Departure Date

Return Date

Destination City

Destination Country

Flight Segments

Rail Segments

Car Segments

# Matching Rules

## Rule 1 -- Traveller Match

Exact Traveller ID

Score:

+50

## Rule 2 -- Email Match

Exact Email

Score:

+30

## Rule 3 -- Employee Number Match

Score:

+40

## Rule 4 -- Destination Match

Hotel City equals Trip City

Score:

+15

## Rule 5 -- Country Match

Score:

+10

## Rule 6 -- Date Overlap

Hotel dates fall inside trip dates.

Score:

+25

## Rule 7 -- Hotel Night Coverage

Hotel covers majority of trip nights.

Score:

+20

## Rule 8 -- Booking Proximity

Hotel booked within 30 days of trip booking.

Score:

+10

# Confidence Thresholds

95-100

Auto Match

80-94

High Confidence Match

Auto Match

60-79

Candidate Match

Manual Review

0-59

No Match

# Reconciliation States

Unmatched

↓

Candidate Match

↓

Matched

↓

Verified

Alternative Paths

Rejected

Expired

Cancelled

# Lifecycle Reassessment

Reconciliation is not static.

Every event triggers reassessment.

Events include:

Trip Updated

Hotel Added

Hotel Modified

Hotel Cancelled

Traveller Changed

Flight Cancelled

Trip Cancelled

# Example Scenario 1

Flight:

London → New York

01 Jun

Return:

05 Jun

No hotel

Three days later:

Separate hotel booking arrives.

New York

01 Jun -- 05 Jun

Result:

95 confidence

Auto Match

No compliance alert.

# Example Scenario 2

Flight:

London → Boston

01 Jun -- 05 Jun

Hotel:

New York

01 Jun -- 05 Jun

Result:

No Match

# Example Scenario 3

Flight:

London → Paris

01 Jun -- 05 Jun

Hotel:

Paris

03 Jun -- 04 Jun

Result:

Partial Coverage

Confidence 72

Manual Review

# Partial Hotel Coverage

The engine shall determine:

Coverage Percentage

Example:

Trip

5 Nights

Hotel

2 Nights

Coverage

40%

Status

Partial Accommodation

# Multiple Hotel Handling

Supported.

Example:

Hotel A

2 Nights

Hotel B

3 Nights

Combined Coverage

100%

Status

Matched

# Orphan Hotel Detection

Definition:

A hotel booking exists but is not attached to any known trip.

Status:

Orphan Booking

The engine shall attempt reassociation for 30 days.

# Event Publishing

## HotelMatched

{ "tripId": "","hotelId": "","confidence": 95, "reasonCodes": \[
"TRAVELLER_MATCH", "DATE_MATCH", "DESTINATION_MATCH" \] }

## HotelRejected

{ "hotelId": "","reason": "LOW_CONFIDENCE" }

## HotelCoverageUpdated

{ "tripId": "","coveragePercent": 80 }

# API Requirements

## POST /reconciliation/evaluate

Evaluate booking.

## GET /reconciliation/{tripId}

Return reconciliation status.

## GET /reconciliation/orphans

Return orphan bookings.

## POST /reconciliation/manual-review

Accept reviewer decision.

# Database Design

## Hotel Bookings

hotel_id

tenant_id

corporate_id

traveller_id

hotel_name

city

country

checkin_date

checkout_date

status

## Reconciliation Matches

match_id

trip_id

hotel_id

confidence_score

status

created_at

updated_at

## Match Reasons

reason_id

match_id

reason_code

weight

## Coverage Records

coverage_id

trip_id

coverage_percent

calculated_at

# AWS Architecture

EventBridge

↓

Reconciliation Lambda

↓

Aurora PostgreSQL

↓

EventBridge

↓

Downstream Services

# Non-Functional Requirements

Evaluation Time

\<2 seconds

Confidence Calculation

\<1 second

Availability

99.9%

Auditability

100%

Every match decision explainable.

# MVP Deliverables

Matching Engine

Confidence Engine

Coverage Calculator

Orphan Booking Service

Manual Review Service

Event Publisher

Audit Service

# Success Criteria

A separate hotel booking enters the platform.

The engine evaluates all active trips.

The hotel is correctly linked to a trip.

Coverage is calculated.

A confidence score is generated.

An audit trail is created.

The Compliance Engine receives a trusted accommodation status.
