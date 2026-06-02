# HCI Project 6 -- Behavioural Intelligence & Optimisation Engine

## Product & Technical Specification

### Purpose

The Behavioural Intelligence & Optimisation Engine analyses traveller
behaviour, booking evolution, communication effectiveness, compliance
outcomes and supplier attainment data to determine the optimal actions
required to maximise hotel recovery, improve compliance and increase
supplier programme performance.

The engine continuously learns from historical behaviour and provides
recommendations to downstream services.

# Business Objective

Transform the platform from:

Reactive Compliance

to

Predictive Compliance

and ultimately

Autonomous Compliance Management

# Business Questions

The engine must answer:

## Question 1

When should the traveller be contacted?

## Question 2

What message should be sent?

## Question 3

What channel should be used?

## Question 4

What is the probability of conversion?

## Question 5

Which opportunities should be prioritised?

## Question 6

Which supplier opportunities are most likely to improve attainment?

# Scope

## In Scope

Behavioural analytics

Predictive modelling

Communication optimisation

Opportunity prioritisation

Traveller segmentation

Supplier attainment optimisation

Forecasting

Recommendation generation

Model training

Model monitoring

## Out of Scope

Direct traveller communications

Booking fulfilment

Policy administration

Portal management

# Core Responsibilities

The service shall:

Analyse behavioural history.

Predict future outcomes.

Generate recommendations.

Publish optimisation events.

Continuously improve model performance.

# Data Sources

## Itinerary Service

Trip lifecycle

Travel frequency

Travel patterns

Destinations

Booking behaviour

## Reconciliation Service

Hotel matching outcomes

Coverage calculations

Orphan booking history

## Opportunity Engine

Opportunity types

Opportunity scores

Opportunity outcomes

Compliance history

## Engagement Platform

Emails sent

Opens

Clicks

Responses

Conversions

Response timings

## Portal

Manual overrides

Agent interventions

Policy exceptions

User actions

# Intelligence Domains

## Domain 1

Traveller Behaviour Intelligence

## Domain 2

Communication Intelligence

## Domain 3

Compliance Intelligence

## Domain 4

Supplier Intelligence

## Domain 5

Revenue Intelligence

# Traveller Behaviour Model

Purpose:

Understand how travellers book accommodation.

# Behaviour Metrics

Average booking delay

Average response time

Preferred suppliers

Booking channel usage

Compliance tendency

Trip patterns

Destination preferences

# Traveller Segments

## Segment A

Highly Compliant

## Segment B

Moderately Compliant

## Segment C

Late Bookers

## Segment D

Out-of-Programme Users

## Segment E

Non-Responders

# Communication Optimisation

Purpose:

Identify best communication strategy.

# Inputs

Traveller profile

Trip type

Destination

Corporate

Historical engagement

Communication history

# Outputs

{ "recommendedChannel": "EMAIL", "recommendedSendTime":
"2026-05-15T09:00:00Z", "conversionProbability": 78 }

# Conversion Prediction Model

Purpose:

Predict likelihood of hotel recovery.

# Inputs

Traveller history

Trip characteristics

Opportunity type

Communication strategy

Corporate profile

Supplier profile

# Outputs

{ "predictedConversion": 84 }

# Opportunity Prioritisation Model

Purpose:

Improve operational efficiency.

# Inputs

Revenue potential

Supplier impact

Compliance impact

Traveller responsiveness

Time to departure

# Outputs

{ "recommendedPriority": "CRITICAL", "predictedValue": 420 }

# Supplier Intelligence

Purpose:

Improve supplier attainment.

# Outputs

Forecast:

{ "supplier": "Marriott", "forecastNights": 925, "commitment": 1000,
"shortfall": 75 }

# Attainment Recovery Opportunities

Identify:

Cities

Travellers

Trips

Corporates

Most likely to improve attainment.

# Compliance Forecasting

Predict:

Future compliance rate

Policy violation trends

Leakage trends

Duty of care coverage

# Recommendation Types

## Traveller Recommendations

Contact traveller

Wait

Escalate to agent

Suppress communication

## Agent Recommendations

Follow-up required

Manual review required

High-value opportunity

## Corporate Recommendations

Policy adjustment

Supplier adjustment

Programme review

# Learning Feedback Loop

Trip Created

↓

Opportunity Created

↓

Communication Sent

↓

Traveller Responded

↓

Hotel Booked

↓

Outcome Recorded

↓

Model Retrained

# Event Publishing

## RecommendationCreated

{ "recommendationType": "CONTACT_TRAVELLER", "tripId": "","confidence":
91 }

## ConversionPredicted

{ "opportunityId": "","probability": 84 }

## SupplierRiskForecasted

{ "supplier": "Marriott", "riskLevel": "HIGH" }

# API Requirements

## GET /intelligence/recommendations

Retrieve recommendations.

## GET /intelligence/conversion

Retrieve conversion predictions.

## GET /intelligence/traveller-profile

Retrieve behavioural profile.

## GET /intelligence/supplier-forecast

Retrieve supplier forecasts.

## GET /intelligence/compliance-forecast

Retrieve compliance forecasts.

# Database Design

## Behaviour Profiles

profile_id

traveller_id

segment

compliance_score

response_score

booking_score

updated_at

## Prediction Records

prediction_id

prediction_type

input_hash

result

confidence

created_at

## Recommendation Records

recommendation_id

recommendation_type

target_entity

confidence

status

created_at

## Model Performance

model_id

metric

value

recorded_at

# AWS Architecture

EventBridge

↓

Data Lake (S3)

↓

Glue

↓

Athena

↓

SageMaker

↓

Intelligence Services

↓

EventBridge

↓

Portal / Engagement Platform

# Machine Learning Components

## Phase 1

Rules-Based Recommendations

No ML

## Phase 2

Predictive Models

Supervised Learning

## Phase 3

Adaptive Optimisation

Continuous Learning

# Non-Functional Requirements

Prediction Latency

\<3 seconds

Recommendation Generation

\<5 seconds

Availability

99.5%

Model Explainability

Mandatory

Auditability

Mandatory

# MVP Deliverables

NONE

This service is excluded from MVP.

# Phase 2 Deliverables

Traveller Segmentation

Communication Recommendations

Conversion Prediction

Supplier Forecasting

# Phase 3 Deliverables

Automated Optimisation

Adaptive Communication Strategies

Autonomous Opportunity Prioritisation

Self-Learning Compliance Models

# Success Criteria

The platform accurately predicts traveller behaviour.

Communication timing improves conversion rates.

Supplier attainment improves.

Hotel recovery increases.

Compliance rates increase.

Operational workload decreases.

Recommendations are explainable and measurable.

Model performance continuously improves.
