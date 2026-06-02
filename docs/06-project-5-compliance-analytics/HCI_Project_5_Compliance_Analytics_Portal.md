# HCI Project 5 -- Compliance Analytics Portal

## Product & Technical Specification

### Purpose

The Compliance Analytics Portal provides a unified user interface for
TMCs and Corporates to manage hotel compliance, supplier programme
performance, duty of care visibility, traveller engagement, and revenue
recovery opportunities.

The portal is the operational command centre for the Hotel Compliance
Intelligence platform.

# Business Objective

Provide actionable visibility into:

Missing hotel opportunities

Hotel compliance

Supplier contract attainment

Traveller engagement

Duty of care coverage

Revenue recovery performance

while enabling operational users to take corrective action.

# User Types

## Platform Administrator

Manages:

Global settings

Tenant management

Feature management

Audit monitoring

## TMC Administrator

Manages:

Corporate customers

TMC users

Communication policies

Opportunity settings

Reporting

## TMC User

Responsible for:

Opportunity management

Traveller support

Escalation management

Compliance monitoring

## Corporate Administrator

Responsible for:

Travel policy

Supplier programmes

Reporting

Compliance management

## Corporate User

Responsible for:

Reviewing opportunities

Monitoring compliance

Reporting

# Scope

## In Scope

Dashboarding

Opportunity management

Supplier contract management

Traveller engagement monitoring

User administration

Corporate configuration

Reporting

Audit visibility

Role-based access

## Out of Scope

Direct hotel booking

Machine learning model management

Travel booking fulfilment

Inventory management

# Portal Navigation Structure

Dashboard

Opportunities

Trips

Travellers

Compliance

Supplier Contracts

Communications

Reports

Administration

Audit

# Dashboard

## Purpose

Provide immediate visibility into platform performance.

# Dashboard Widgets

## Open Opportunities

Total active opportunities.

## Critical Opportunities

High-priority items requiring action.

## Revenue Recovery

Estimated recoverable hotel revenue.

## Recovered Revenue

Recovered bookings value.

## Hotel Compliance

Percentage compliant.

## Duty of Care Coverage

Percentage of trips with known accommodation.

## Supplier Contract Performance

Current attainment progress.

## Traveller Engagement

Open rates

Click rates

Conversion rates

# Opportunity Management

## Purpose

Manage all identified opportunities.

# Opportunity List View

Columns:

Opportunity ID

Traveller

Corporate

Trip

Destination

Type

Priority

Score

Status

Owner

Created Date

# Filters

Corporate

Traveller

Country

Opportunity Type

Priority

Status

Date Range

# Opportunity Detail View

Displays:

Trip summary

Traveller information

Accommodation status

Opportunity reasoning

Revenue estimate

Communication history

Audit history

Recommended action

# Opportunity Actions

Assign

Escalate

Close

Override

Comment

Create Booking Request

# Trip Management

## Purpose

Provide visibility into travel activity.

# Trip Detail View

Traveller

Destination

Travel dates

Trip status

Timeline

Accommodation status

Opportunity status

Duty of care status

# Traveller Management

## Traveller Profile

Traveller details

Travel history

Compliance history

Communication history

Hotel behaviour profile

Duty of care profile

# Compliance Management

## Corporate Compliance Dashboard

Hotel attachment rate

Preferred supplier usage

Policy violations

Leakage rate

Non-compliant bookings

# Compliance Drilldowns

By:

Traveller

Department

Country

Region

Supplier

Business Unit

# Supplier Contract Management

## Purpose

Track attainment against negotiated hotel agreements.

# Supplier Dashboard

Supplier

Committed Nights

Actual Nights

Forecast Nights

Variance

Risk Level

# Supplier Risk Categories

On Track

Watch

At Risk

Critical

# Contract Forecasting

Display:

Projected Year-End Attainment

Expected Shortfall

Expected Surplus

Recovery Opportunities

# Communications Management

## Purpose

Monitor traveller engagement.

# Communication Dashboard

Sent

Delivered

Opened

Clicked

Responded

Converted

# Communication Detail

Message content

Delivery history

Traveller response

Associated opportunity

Associated trip

# Reporting Module

## Standard Reports

Hotel Compliance Report

Hotel Leakage Report

Duty of Care Report

Supplier Attainment Report

Traveller Engagement Report

Revenue Recovery Report

# Export Formats

CSV

Excel

PDF

API Export

# Administration Module

## Tenant Management

Create tenant

Edit tenant

Deactivate tenant

# User Management

Create user

Assign role

Deactivate user

Reset password

# Corporate Configuration

Travel policies

Hotel policies

Communication settings

Supplier programmes

Risk settings

# Audit Module

## Purpose

Provide complete traceability.

# Audit Views

User Actions

Opportunity Changes

Policy Changes

Communication Events

Administrative Changes

System Events

# Multi-Tenant Security

## Tenant Isolation

Mandatory

Users may only access data belonging to:

Their tenant

Their assigned corporates

Their assigned role permissions

# Role-Based Permissions

Platform Admin

Full Access

TMC Admin

All corporate accounts

TMC User

Assigned corporate accounts

Corporate Admin

Own corporate account

Corporate User

Read-only or limited access

# Functional Requirements

## FR1

Dashboard visualisation

## FR2

Opportunity management

## FR3

Trip visibility

## FR4

Traveller visibility

## FR5

Supplier contract monitoring

## FR6

Communication monitoring

## FR7

Reporting

## FR8

Administration

## FR9

Audit management

# API Consumption

Consumes:

Itinerary Service

Reconciliation Service

Opportunity Engine

Traveller Engagement Service

Future Intelligence Service

# AWS Architecture

CloudFront

↓

React Front End

↓

API Gateway

↓

Backend Services

↓

Aurora PostgreSQL

# Front-End Technology

React

TypeScript

Material UI

Amazon Cognito

AWS Amplify

Charting Library

AG Grid

# Non-Functional Requirements

Page Load

\<2 seconds

Dashboard Refresh

\<5 seconds

Availability

99.9%

Accessibility

WCAG 2.1 AA

Audit Retention

7 years

# MVP Deliverables

Dashboard

Opportunity Management

Trip Management

Traveller Management

Compliance Reporting

Supplier Reporting

Communications Reporting

Administration

Audit Portal

# Success Criteria

Users can log in securely.

Users can view opportunities.

Users can manage traveller interventions.

Users can monitor compliance.

Users can track supplier commitments.

Users can review engagement performance.

Users can export reports.

All actions are auditable.

# Phase 2 Enhancements

Custom dashboards

Drag-and-drop reporting

Benchmarking

Predictive compliance analytics

Advanced supplier forecasting

# Phase 3 Enhancements

AI compliance assistant

Natural language querying

Conversational analytics

Autonomous compliance recommendations

Executive insight dashboards
