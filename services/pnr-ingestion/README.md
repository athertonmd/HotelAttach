# PNR Ingestion Service

## Bounded Context

PNR Ingestion

## Purpose

Receives itinerary data from Mantic Point via REST webhook, transforms it into the canonical HCI model, and publishes lifecycle events to EventBridge.

This service is the entry point for all travel data into the platform.

## Responsibilities

- Receive Mantic Point webhook POST payloads
- Validate incoming data against expected format
- Transform external DTO → canonical PNR/Trip/Segment model (adapter layer)
- Detect hotel segments and publish BookingCreated/BookingUpdated/BookingCancelled events
- Implement versioned PNR processing (out-of-order handling)
- Publish PNRCreated, PNRUpdated events
- Maintain audit history of all ingested data
- Enforce tenant isolation

## Adapter Layer (Approved Decision Q1)

```
Mantic Point Webhook → Inbound DTO → Validation → Transformation → Canonical Model → Event Publication
```

Downstream services must never be coupled to the Mantic Point source format.

## Events Published

- PNRCreated
- PNRUpdated
- BookingCreated (when hotel segment detected — Approved Decision Q2)
- BookingUpdated
- BookingCancelled

## Out-of-Order Processing (Approved Decision Q8)

- Every PNR update includes a version/timestamp
- Newer versions supersede older versions
- Late-arriving older versions do not overwrite canonical state
- All received versions are retained in audit/history
- Processing is idempotent

## Database Schema

Owned tables: `pnrs`, `raw_pnr_references`

## Capacity (Approved Decision Q9)

- 50,000 PNRs/day
- 150,000 segments/day

## Sources

- Project 1 Specification
- Architecture & Integration Guide §4.1
- Approved Decisions Q1, Q2, Q8, Q9
