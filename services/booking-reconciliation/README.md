# Booking Reconciliation Service

## Bounded Context

Booking Reconciliation

## Purpose

Determines whether hotel bookings belong to known trips using probabilistic matching. Prevents false compliance alerts and improves duty-of-care accuracy.

## Responsibilities

- Receive hotel booking events (BookingCreated, BookingUpdated, BookingCancelled)
- Search candidate trips for matching
- Calculate match confidence scores (0–100) using weighted rules
- Determine coverage percentage
- Manage reconciliation lifecycle (Unmatched → Candidate → Matched → Verified)
- Detect orphan bookings (unattached for 30 days)
- Support manual review decisions
- Continuously reassess on lifecycle events
- Publish reconciliation events

## Matching Rules (Business Rules BR-200)

| Rule                        | Score |
| --------------------------- | ----- |
| Exact Traveller Match       | +50   |
| Employee Number Match       | +40   |
| Email Match                 | +30   |
| Date Overlap                | +25   |
| Full Night Coverage         | +20   |
| Destination City Match      | +15   |
| Country Match               | +10   |
| Booking Proximity (30 days) | +10   |

## Confidence Thresholds

- 80–100: Auto Match
- 60–79: Manual Review
- 0–59: No Match

## Events Consumed

- TripCreated, TripUpdated
- SegmentAdded, SegmentUpdated, SegmentRemoved
- TravellerUpdated
- BookingCreated, BookingCancelled

## Events Published

- HotelMatched
- HotelRejected
- HotelCoverageUpdated
- HotelOrphanDetected
- ReconciliationUpdated

## Database Schema

Owned tables: `hotel_bookings`, `reconciliation_matches`, `match_reasons`, `coverage_records`

## Capacity

- 50,000 hotel bookings/day
- Evaluation time <2 seconds

## Sources

- Project 2 Specification
- Architecture & Integration Guide §4.5
- Business Rules Catalogue BR-200, BR-300
