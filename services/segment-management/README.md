# Segment Management Service

## Bounded Context

Segment Management

## Purpose

Manages travel segments (flight, hotel, rail, car, transfer) as independently versioned entities linked to trips.

## Responsibilities

- Create/update/remove segments from PNR events
- Support segment types: Flight, Hotel, Rail, Car, Transfer, Other
- Independently version each segment
- Publish SegmentAdded, SegmentUpdated, SegmentRemoved events
- Maintain audit history

## Events Consumed

- PNRCreated, PNRUpdated

## Events Published

- SegmentAdded
- SegmentUpdated
- SegmentRemoved

## Database Schema

Owned tables: `segments`, `segment_type_data`

## Capacity

- 150,000 segments/day

## Sources

- Project 1 Specification §FR4
- Architecture & Integration Guide §4.3
