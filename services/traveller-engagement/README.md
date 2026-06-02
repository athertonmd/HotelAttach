# Traveller Engagement Service

## Bounded Context

Traveller Engagement

## Purpose

Provides automated communication workflows that encourage travellers to complete accommodation bookings through approved channels. Converts opportunities into hotel bookings.

## Responsibilities

- Receive opportunity events and determine communication strategy
- Schedule communications based on business rules (BR-900)
- Deliver branded email communications via SES
- Generate secure one-time action tokens for traveller landing pages
- Capture traveller responses (Book Hotel, Already Booked, No Hotel Needed, Contact Agent)
- Create booking requests for TMC agents
- Manage agent escalation queue
- Track communication lifecycle and conversion
- Publish engagement events

## Communication Channel (MVP)

Email only (via Amazon SES). Future channels: SMS, Push, WhatsApp, Teams, Slack.

## SES Configuration (Approved Decision Q6)

Single platform SES account with:

- Tenant-level sending limits
- Suppression handling
- Bounce/complaint handling
- Branded templates
- Audit logging

## Events Consumed

- OpportunityCreated, OpportunityUpdated, OpportunityEscalated, OpportunityClosed

## Events Published

- CommunicationSent
- TravellerResponded
- BookingRequestCreated
- OpportunityConverted

## Database Schema

Owned tables: `communications`, `communication_events`, `traveller_responses`, `booking_requests`

## Capacity

- 25,000 communications/day

## Sources

- Project 4 Specification
- Architecture & Integration Guide §4.7
- Business Rules Catalogue BR-900, BR-1000
- Approved Decision Q6
