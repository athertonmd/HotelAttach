# HCI Platform — Services

This directory contains the backend domain services for the Hotel Compliance Intelligence platform.

Each service represents one or more bounded contexts and owns its domain logic, database schema, event publishing, and API endpoints.

## Service Catalogue

| Service                  | Bounded Context(s)     | MVP | Description                                                              |
| ------------------------ | ---------------------- | --- | ------------------------------------------------------------------------ |
| `pnr-ingestion`          | PNR Ingestion          | Yes | Receives itinerary data from Mantic Point, transforms to canonical model |
| `trip-management`        | Trip Management        | Yes | Creates and maintains trip records from PNR/segment events               |
| `segment-management`     | Segment Management     | Yes | Manages flight, hotel, rail, car segments                                |
| `traveller`              | Traveller              | Yes | Traveller identity, profile matching, deduplication                      |
| `booking-reconciliation` | Booking Reconciliation | Yes | Matches hotel bookings to trips, confidence scoring, coverage            |
| `opportunity-detection`  | Opportunity Detection  | Yes | Detects missing/non-compliant hotel opportunities                        |
| `traveller-engagement`   | Traveller Engagement   | Yes | Communications, traveller responses, booking requests                    |
| `analytics-api`          | Analytics Read Model   | Yes | Read-model projections for the Compliance Analytics Portal               |

## Architecture Rules

1. Each service owns its own database schema within the shared Aurora PostgreSQL cluster.
2. No service may write to another service's schema.
3. Cross-service communication uses EventBridge events or published APIs.
4. All services use the shared packages (@hci/shared-types, @hci/event-contracts, @hci/validation, @hci/observability).
5. Every service must enforce tenant isolation via tenantId.
6. Every domain decision must be auditable.

## Implementation Order

Services are implemented in the order defined by the Architecture & Integration Guide §14:

1. Foundation packages (shared-types, event-contracts, validation, observability)
2. PNR Ingestion, Trip Management, Segment Management, Traveller
3. Booking Reconciliation
4. Opportunity Detection
5. Traveller Engagement
6. Analytics API

## Sources

- Architecture & Integration Guide §4 (Bounded Contexts)
- Architecture & Integration Guide §9 (Database Ownership)
- Architecture & Integration Guide §14 (Implementation Sequence)
