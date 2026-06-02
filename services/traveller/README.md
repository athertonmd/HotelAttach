# Traveller Service

## Bounded Context

Traveller

## Purpose

Manages traveller identity, profile matching, and deduplication. Provides the master traveller record for the platform.

## Responsibilities

- Create/update traveller records from PNR events
- Match incoming traveller data to existing records (deduplication)
- Maintain traveller identifiers (email, employee number, profile ID)
- Publish TravellerCreated, TravellerUpdated events
- Maintain audit history

## Events Consumed

- PNRCreated, PNRUpdated

## Events Published

- TravellerCreated
- TravellerUpdated

## Database Schema

Owned tables: `travellers`, `traveller_identifiers`

## Sources

- Project 1 Specification §FR1
- Architecture & Integration Guide §4.4
