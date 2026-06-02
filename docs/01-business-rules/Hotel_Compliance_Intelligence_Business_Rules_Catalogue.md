# Hotel Compliance Intelligence (HCI)

# Business Rules & Decision Catalogue

Version: 1.0

Status: Authoritative Business Rules Source

Owner: Product Management

Purpose:

This document defines the business rules used by the Hotel Compliance
Intelligence platform.

All platform decisions must be traceable to a rule contained within this
catalogue.

No business logic should be hard-coded outside these rules.

# Rule Governance

Each rule must contain:

Rule ID

Rule Name

Description

Inputs

Decision Logic

Output

Priority

Effective Date

Status

Owner

Version

# Rule Categories

BR-100 Hotel Requirement Rules

BR-200 Booking Reconciliation Rules

BR-300 Accommodation Coverage Rules

BR-400 Compliance Rules

BR-500 Opportunity Detection Rules

BR-600 Opportunity Scoring Rules

BR-700 Duty Of Care Rules

BR-800 Supplier Contract Rules

BR-900 Traveller Engagement Rules

BR-1000 Opportunity Closure Rules

BR-1100 Manual Override Rules

# BR-100

# Hotel Requirement Rules

Purpose:

Determine whether accommodation should exist for a trip.

## BR-101

Same Day Return

Description:

Traveller departs and returns on same calendar day.

Decision:

Hotel Not Required

Priority:

High

## BR-102

Trip Duration Over 24 Hours

Decision:

Hotel Required

Priority:

High

## BR-103

Overnight Stay

Decision:

Hotel Required

Condition:

Trip spans multiple dates.

## BR-104

Arrival After 22:00

Decision:

Hotel Likely Required

Confidence:

75

## BR-105

Departure Before 07:00

Decision:

Hotel Likely Required

Confidence:

75

## BR-106

International Multi-Day Trip

Decision:

Hotel Required

Confidence:

95

## BR-107

Long Distance Domestic Trip

Condition:

Distance \> 150 miles

Duration \> 1 day

Decision:

Hotel Required

## BR-108

Corporate Exception

Corporate policy may override all hotel requirement rules.

Priority:

Highest

# BR-200

# Booking Reconciliation Rules

Purpose:

Determine whether accommodation already exists.

## BR-201

Exact Traveller Match

Score:

+50

## BR-202

Employee Number Match

Score:

+40

## BR-203

Email Match

Score:

+30

## BR-204

Destination City Match

Score:

+15

## BR-205

Country Match

Score:

+10

## BR-206

Date Overlap

Score:

+25

## BR-207

Full Night Coverage

Score:

+20

## BR-208

Booking Proximity

Hotel booked within 30 days of trip creation.

Score:

+10

## BR-209

Manual Match Accepted

Decision:

Force Match

Priority:

Highest

## BR-210

Manual Match Rejected

Decision:

Force Reject

Priority:

Highest

# BR-300

# Accommodation Coverage Rules

Purpose:

Determine how much of a trip is covered.

## BR-301

100% Coverage

Status:

Fully Covered

## BR-302

80-99% Coverage

Status:

Mostly Covered

## BR-303

50-79% Coverage

Status:

Partially Covered

## BR-304

1-49% Coverage

Status:

Minimally Covered

## BR-305

0% Coverage

Status:

No Accommodation

# BR-400

# Compliance Rules

Purpose:

Determine policy compliance.

## BR-401

Preferred Supplier Required

Decision:

Compliant if supplier approved.

## BR-402

Rate Cap

Decision:

Non-Compliant if nightly rate exceeds policy.

## BR-403

Location Restriction

Decision:

Non-Compliant if hotel outside approved area.

## BR-404

Risk Restriction

Decision:

Non-Compliant if destination risk exceeds policy threshold.

## BR-405

Sustainability Requirement

Decision:

Non-Compliant if hotel sustainability score below threshold.

## BR-406

Executive Traveller Exception

Policy exceptions may apply.

# BR-500

# Opportunity Detection Rules

Purpose:

Determine whether an actionable opportunity exists.

## BR-501

Missing Hotel

Condition:

Hotel Required

AND

Coverage = 0%

Decision:

Create Opportunity

## BR-502

Partial Accommodation

Condition:

Coverage \< 100%

Decision:

Create Opportunity

## BR-503

Non-Preferred Supplier

Condition:

Hotel exists

AND

Supplier not approved

Decision:

Create Opportunity

## BR-504

Supplier Leakage

Condition:

Hotel booked outside preferred programme

Decision:

Create Opportunity

## BR-505

Duty Of Care Gap

Condition:

Trip exists

AND

Accommodation unknown

Decision:

Create Opportunity

## BR-506

Supplier Contract Risk

Condition:

Forecast below commitment

Decision:

Create Opportunity

# BR-600

# Opportunity Scoring Rules

Purpose:

Prioritise opportunities.

# Scoring Components

Hotel Requirement Confidence

Weight:

25%

Compliance Severity

Weight:

20%

Revenue Opportunity

Weight:

20%

Duty Of Care Impact

Weight:

15%

Supplier Contract Impact

Weight:

10%

Time To Departure

Weight:

10%

# Priority Thresholds

80-100

Critical

60-79

High

40-59

Medium

0-39

Low

# BR-700

# Duty Of Care Rules

Purpose:

Determine traveller visibility.

## BR-701

Accommodation Known

Status:

Known

## BR-702

Partial Accommodation Known

Status:

Partially Known

## BR-703

No Accommodation Data

Status:

Unknown

## BR-704

High Risk Destination

Increase priority by 20%.

# BR-800

# Supplier Contract Rules

Purpose:

Monitor supplier commitments.

## BR-801

Forecast Below Commitment

Risk:

High

## BR-802

Forecast Within 5%

Risk:

Watch

## BR-803

Forecast Above Commitment

Risk:

On Track

## BR-804

Preferred Supplier Opportunity

Create recovery opportunity.

# BR-900

# Traveller Engagement Rules

Purpose:

Determine communication behaviour.

## BR-901

Missing Hotel

Initial Contact:

2 days after booking

## BR-902

No Response

Reminder:

7 days before departure

## BR-903

High Value Opportunity

Escalate to Agent

## BR-904

Traveller Declined

Suppress further communication

30 days

## BR-905

Executive Traveller

Agent Review First

## BR-906

Trip Within 48 Hours

Immediate Escalation

# BR-1000

# Opportunity Closure Rules

Purpose:

Determine when opportunities close.

## BR-1001

Hotel Added

Close Opportunity

## BR-1002

Traveller Declined

Close Opportunity

## BR-1003

Trip Cancelled

Close Opportunity

## BR-1004

Manual Closure

Close Opportunity

## BR-1005

Opportunity Expired

Close Opportunity

# BR-1100

# Manual Override Rules

Purpose:

Allow human intervention.

## BR-1101

Manual Compliance Override

Allowed:

Corporate Admin

TMC Admin

## BR-1102

Manual Opportunity Closure

Allowed:

TMC User

TMC Admin

Corporate Admin

## BR-1103

Manual Reconciliation Override

Allowed:

TMC Admin

Platform Admin

## BR-1104

All Overrides Audited

Mandatory

Fields:

User

Timestamp

Reason

Previous Value

New Value

# Decision Audit Requirements

Every platform decision must store:

Decision ID

Rule ID

Rule Version

Input Data

Decision Result

Confidence Score

Timestamp

Correlation ID

Source Service

User (if applicable)

# Future Rule Categories

BR-1200 AI Recommendation Rules

BR-1300 Traveller Segmentation Rules

BR-1400 Communication Optimisation Rules

BR-1500 Autonomous Recovery Rules

BR-1600 Supplier Forecasting Rules

These categories are reserved for the Behavioural Intelligence Engine.
