# HCI Project 4 -- Traveller Engagement Platform

## Product & Technical Specification

### Purpose

The Traveller Engagement Platform provides automated and assisted
communication workflows that encourage travellers to complete
accommodation bookings through approved channels.

The platform transforms identified opportunities into completed hotel
bookings while improving traveller experience and reducing TMC workload.

# Business Objective

Convert hotel opportunities into:

Hotel bookings

Policy-compliant bookings

Preferred supplier bookings

Duty of care visibility

Supplier contract attainment

while minimising agent intervention.

# Business Questions

The platform must answer:

## Question 1

Should the traveller be contacted?

## Question 2

When should the traveller be contacted?

## Question 3

What message should be delivered?

## Question 4

What action should the traveller take?

## Question 5

Did the traveller convert?

# Scope

## In Scope

Email communications

Traveller landing pages

Opportunity response capture

Booking request workflows

Communication scheduling

Communication history

Response tracking

Campaign analytics

Agent escalation

## Out of Scope

Hotel inventory

Hotel booking engine

Payment processing

Machine learning optimisation

Corporate reporting

Contract forecasting

# Core Responsibilities

The platform shall:

Receive opportunities.

Determine communication strategy.

Deliver traveller messages.

Capture traveller responses.

Create booking requests.

Escalate where required.

Track conversion outcomes.

# Communication Channels

## MVP

Email

## Future

SMS

Push Notifications

WhatsApp

Microsoft Teams

Slack

Mobile App Messaging

# Traveller Communication Scenarios

## Scenario 1 -- Missing Hotel

Trip:

London → New York

4 nights

No hotel identified

Traveller receives:

"You appear to have a trip to New York but no hotel reservation."

Actions:

Book Hotel

Already Booked

No Hotel Required

Contact Agent

## Scenario 2 -- Partial Coverage

Trip:

5 nights

Hotel:

2 nights

Traveller receives:

"It appears your accommodation only covers part of your trip."

Actions:

Extend Hotel

Add Hotel

Contact Agent

## Scenario 3 -- Non-Preferred Hotel

Traveller booked outside programme.

Traveller receives:

"Alternative preferred hotels are available."

Actions:

Keep Existing

View Alternatives

Contact Agent

# Functional Requirements

## FR1 -- Communication Trigger Engine

Receive events from Opportunity Engine.

Example:

Opportunity Created

Opportunity Updated

Opportunity Escalated

Output:

Communication Recommendation

Example

{ "opportunityId": "123", "communicationType": "MISSING_HOTEL",
"recommendedSendDate": "2026-05-15" }

# FR2 -- Communication Scheduling

Support:

Immediate

Scheduled

Recurring

Escalated

Examples

Immediately after booking

3 days after booking

7 days before departure

48 hours before departure

# FR3 -- Email Delivery

Deliver branded communications.

Support:

Corporate branding

TMC branding

White-label branding

Multi-language templates

# Email Components

Traveller name

Trip summary

Destination

Dates

Opportunity summary

Call to action

Support information

# FR4 -- Traveller Landing Pages

Every communication contains a secure action link.

Traveller does not require login.

Capabilities

View trip summary

View opportunity

Select response

Request assistance

Submit hotel requirements

# FR5 -- Traveller Response Capture

Supported Responses

Book Hotel

Already Booked

No Hotel Needed

Contact Agent

Ignore

Output

{ "travellerResponse": "ALREADY_BOOKED" }

# FR6 -- Hotel Booking Request Workflow

Traveller can request accommodation.

Required Inputs

Destination

Check-In Date

Check-Out Date

Budget

Preferred Area

Special Requirements

Output

Booking Request

Sent to:

TMC Agent

Hotel Team

Hotel Booking API (Future)

# FR7 -- Agent Escalation

Escalate when:

Traveller requests support

Traveller does not respond

Traveller rejects recommendation

Critical compliance risk exists

Escalation Queue

Assigned Agent

Priority

Due Date

Status

# FR8 -- Communication History

Store:

Messages sent

Messages opened

Links clicked

Responses received

Bookings created

Conversions achieved

# Communication Lifecycle

Pending

↓

Scheduled

↓

Sent

↓

Delivered

↓

Opened

↓

Clicked

↓

Responded

↓

Converted

Alternative States

Bounced

Failed

Expired

# Conversion Tracking

Track:

Communication Sent

↓

Communication Opened

↓

Landing Page Viewed

↓

Traveller Responded

↓

Booking Requested

↓

Hotel Added

↓

Opportunity Closed

# Event Publishing

## CommunicationSent

{ "communicationId": "","opportunityId": "","channel": "EMAIL" }

## TravellerResponded

{ "communicationId": "","response": "BOOK_HOTEL" }

## OpportunityConverted

{ "opportunityId": "","conversionType": "HOTEL_BOOKED" }

# API Requirements

## POST /communications/send

Send communication.

## GET /communications

Retrieve communication history.

## GET /traveller/{token}

Retrieve traveller action page.

## POST /traveller/respond

Submit traveller response.

## POST /booking-request

Create booking request.

# Database Design

## Communications

communication_id

tenant_id

corporate_id

opportunity_id

traveller_id

channel

status

sent_at

opened_at

responded_at

## Communication Events

event_id

communication_id

event_type

event_timestamp

## Traveller Responses

response_id

communication_id

response_type

comments

created_at

## Booking Requests

request_id

traveller_id

trip_id

status

created_at

updated_at

# AWS Architecture

EventBridge

↓

Engagement Engine

↓

SES

↓

Traveller Portal

↓

Aurora PostgreSQL

↓

EventBridge

↓

Downstream Services

# Security Requirements

Secure one-time access tokens

Token expiration

Rate limiting

Encrypted links

Audit logging

PII protection

GDPR compliance

# Non-Functional Requirements

Email Delivery Success

99%

Landing Page Load Time

\<2 seconds

Response Capture

\<1 second

Availability

99.9%

# MVP Deliverables

Communication Engine

Email Templates

Traveller Landing Pages

Response Capture Service

Booking Request Workflow

Agent Escalation Queue

Communication History Service

Audit Service

# Success Criteria

An opportunity is detected.

The traveller receives communication.

The traveller opens the message.

The traveller selects an action.

A booking request is generated.

A hotel booking is attached to the trip.

The opportunity is closed.

All actions are recorded and auditable.

# Phase 2 Enhancements

SMS

Push Notifications

WhatsApp

AI-generated messaging

Personalised content

Dynamic hotel recommendations

Traveller preference profiles

# Phase 3 Enhancements

Autonomous hotel recovery agent

AI communication optimisation

Multi-channel orchestration

Behaviour-based messaging

Predictive intervention timing

Conversational AI travel assistant
