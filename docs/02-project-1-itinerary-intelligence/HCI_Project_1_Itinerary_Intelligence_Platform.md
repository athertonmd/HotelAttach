# HCI Project 1 -- Itinerary Intelligence Platform

## Product & Technical Specification

### Purpose

The Itinerary Intelligence Platform is the foundational service for the
Hotel Compliance Intelligence ecosystem.

Its responsibility is to ingest itinerary data from Mantic Point, create
a canonical travel model, track itinerary evolution over time, and
publish travel events to downstream services.

This service does not make compliance decisions.

This service provides trusted travel data for all downstream engines.

# Business Objective

Create a single source of truth for:

Travellers

Trips

PNRs

Travel Segments

Itinerary Lifecycle Events

The platform must support continuous booking evolution from initial
booking through trip completion.

# Scope

## In Scope

PNR ingestion

Traveller management

Trip management

Travel segment management

Booking lifecycle tracking

Trip timeline generation

Event publishing

Audit history

Multi-tenant support

## Out of Scope

Hotel compliance

Opportunity scoring

Traveller communications

Reporting

Machine learning

Supplier contract management

# Core Responsibilities

The service shall:

Receive itinerary updates from Mantic Point.

Identify whether the update belongs to:

Existing traveller

Existing trip

Existing booking

Update trip state.

Maintain full historical timeline.

Publish lifecycle events.

# User Roles

## Platform Administrator

System administration.

## TMC Administrator

View and manage tenant data.

## Corporate Administrator

View corporate travel data.

## Read-Only Consumer Services

Opportunity Engine

Reconciliation Engine

Analytics Portal

# Functional Requirements

## FR1 -- Traveller Management

The system shall maintain a master traveller record.

### Traveller Attributes

Traveller ID

Corporate ID

Employee Number

First Name

Last Name

Email

Mobile Number

Cost Centre

Country

Status

Created Date

Updated Date

### Acceptance Criteria

Given a new traveller is received

When no matching traveller exists

Then a new traveller record shall be created.

## FR2 -- PNR Management

The system shall store source booking records.

### Attributes

PNR ID

Record Locator

Source System

Booking Date

Ticket Date

Status

Corporate ID

Traveller ID

Version Number

## FR3 -- Trip Management

The system shall group related travel segments into trips.

### Example

Flight:

London → New York

Hotel:

New York

Return:

New York → London

Single Trip

## FR4 -- Segment Management

Supported segment types:

Flight

Hotel

Rail

Car

Transfer

Other

Each segment shall be independently versioned.

## FR5 -- Itinerary Evolution Tracking

The system shall track itinerary changes.

Examples:

Flight added

Flight removed

Hotel added

Hotel cancelled

Date changed

Traveller changed

## FR6 -- Timeline Generation

Every trip shall contain a chronological timeline.

Example:

01 May Booking Created

02 May Flight Added

05 May Hotel Added

06 May Hotel Modified

15 May Trip Completed

## FR7 -- Event Publishing

The system shall publish domain events.

### Events

TravellerCreated

TravellerUpdated

PNRCreated

PNRUpdated

TripCreated

TripUpdated

SegmentAdded

SegmentRemoved

SegmentUpdated

TripCompleted

# Domain Model

## Traveller

Parent entity.

Relationships:

1 Traveller Many Trips

## Trip

Parent travel object.

Relationships:

1 Trip Many Segments

1 Trip Many Timeline Events

## Segment

Child travel object.

Types:

Flight

Hotel

Rail

Car

Transfer

## Timeline Event

Immutable history record.

# Trip Lifecycle

Draft

Booked

Ticketed

Pre-Trip

In Trip

Completed

Cancelled

# Event Contracts

## PNRCreated

Payload:

{ "tenantId": "","corporateId": "","pnrId": "","travellerId":
"","createdDate": "" }

## TripUpdated

Payload:

{ "tripId": "","changeType": "","timestamp": "" }

# API Requirements

## POST /pnrs

Create or update PNR.

## GET /trips/{id}

Retrieve trip.

## GET /travellers/{id}

Retrieve traveller.

## GET /trips

Search trips.

## GET /timeline/{tripId}

Retrieve timeline.

# Database Design

## Travellers

traveller_id

tenant_id

corporate_id

first_name

last_name

email

mobile

created_at

updated_at

## Trips

trip_id

tenant_id

corporate_id

traveller_id

status

start_date

end_date

created_at

updated_at

## Segments

segment_id

trip_id

segment_type

start_datetime

end_datetime

origin

destination

status

created_at

updated_at

## Timeline Events

event_id

trip_id

event_type

event_data

created_at

# AWS Architecture

API Gateway

↓

Lambda

↓

Aurora PostgreSQL

↓

EventBridge

↓

Downstream Services

# Non-Functional Requirements

Availability

99.9%

API Response

\<500ms

Event Publication

\<30 seconds

Multi-Tenant Isolation

Mandatory

Encryption At Rest

Mandatory

Encryption In Transit

Mandatory

# MVP Deliverables

Traveller Service

PNR Service

Trip Service

Timeline Service

Event Publishing Service

Audit Service

AWS Deployment

CI/CD Pipeline

Monitoring

# Success Criteria

A travel booking enters the platform.

A canonical traveller exists.

A canonical trip exists.

All segments are linked.

The itinerary timeline is generated.

Lifecycle events are published.

Downstream services can consume the trip without requiring direct access
to the source PNR.
