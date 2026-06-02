# Trip Management Service

## Bounded Context

Trip Management

## Purpose

Creates and maintains canonical trip records derived from PNRs, bookings, and segments. Manages trip lifecycle state and timeline generation.

## Responsibilities

- Create trip records from PNR events
- Maintain trip lifecycle (Draft → Booked → Ticketed → Pre-Trip → In Trip → Completed → Cancelled)
- Link segments to trips
- Generate chronological trip timelines
- Publish TripCreated, TripUpdated, TripCompleted events
- Maintain audit history

## Events Consumed

- PNRCreated, PNRUpdated
- SegmentAdded, SegmentUpdated, SegmentRemoved

## Events Published

- TripCreated
- TripUpdated
- TripCompleted

## Database Schema

Owned tables: `trips`, `trip_segments`, `timeline_events`

## Capacity

- 25,000 trips/day

## Sources

- Project 1 Specification §FR3, §FR6
- Architecture & Integration Guide §4.2
