# Future Event Schemas — TODO

The following schemas are required by the Architecture & Integration Guide §7 but do not yet exist in `/schemas`. They will be created as their respective projects are implemented.

## Project 2 — Booking Reconciliation Engine

- `booking-created.schema.json`
- `booking-updated.schema.json`
- `booking-cancelled.schema.json`
- `hotel-matched.schema.json`
- `hotel-rejected.schema.json`
- `hotel-coverage-updated.schema.json`

## Project 3 — Opportunity Detection Engine

- `opportunity-created.schema.json`
- `opportunity-updated.schema.json`
- `opportunity-closed.schema.json`

## Project 4 — Traveller Engagement Platform

- `communication-sent.schema.json`
- `traveller-responded.schema.json`
- `booking-request-created.schema.json`

## Notes

- These schemas must conform to the envelope standard defined in `envelope.schema.json`
- Each schema must include an `eventType.const` value matching the approved event name
- The `envelope.schema.json` `eventType.enum` must be updated to include new event types when schemas are added
- TypeScript types, validators, fixtures, and contract tests must be added for each new schema
