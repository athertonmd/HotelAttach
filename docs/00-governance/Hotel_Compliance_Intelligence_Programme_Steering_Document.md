# Hotel Compliance Intelligence (HCI)

## Programme Steering Document

### Purpose

This document acts as the master architecture and governance document
for all HCI development streams.

Individual projects may be developed independently but must conform to
this document.

# Programme Vision

Provide corporations and TMCs with a platform that identifies missing
hotel bookings, improves supplier contract compliance, improves duty of
care coverage and recovers hotel revenue opportunities.

# Programme Architecture

Data Source ↓ Project 1 - Itinerary Intelligence Platform ↓ Project 2 -
Booking Reconciliation Service ↓ Project 3 - Opportunity Detection
Engine ↓ Project 4 - Traveller Engagement Platform ↓ Project 5 -
Compliance Analytics Portal ↓ Project 6 - Machine Learning Optimisation
Engine

# Shared Standards

## Authentication

AWS Cognito

## Database

Aurora PostgreSQL

## Event Bus

EventBridge

## Messaging

SES

## Storage

S3

## API Style

REST + JWT

## Audit

Mandatory

## Tenant Isolation

Mandatory

# Canonical Business Objects

Traveller

Trip

PNR

Flight Segment

Hotel Segment

Supplier Contract

Opportunity

Communication Event

Audit Event

These objects are owned by Project 1 and consumed by all other projects.

# Event Contracts

PNRCreated

PNRUpdated

TripCreated

TripUpdated

HotelMatched

OpportunityCreated

OpportunityClosed

CommunicationSent

TravellerResponded

All projects must publish and consume only approved events.

# MVP Sequence

Phase 1

Project 1 Project 2

Phase 2

Project 3

Phase 3

Project 4

Phase 4

Project 5

Phase 5

Project 6

This sequence minimises technical risk and creates usable business value
early.
